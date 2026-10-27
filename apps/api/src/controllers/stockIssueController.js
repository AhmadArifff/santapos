const db = require('../config/db');
const { getRequestBranchId } = require('../utils/branchContext');

const VALID_REASONS = ['expired', 'damaged', 'lost', 'other'];
const VALID_STATUSES = ['reported', 'resolved', 'rejected'];

async function recalcStockItem(conn, stockItemId) {
  const [[calc]] = await conn.query(
    `SELECT
      GREATEST(0,
        COALESCE(SUM(CASE WHEN type='in' THEN qty ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type='out' THEN qty ELSE 0 END), 0)
      ) AS correct_stock,
      COALESCE(SUM(CASE WHEN type='in' THEN total_cost ELSE 0 END), 0) AS total_cost_in,
      COALESCE(SUM(CASE WHEN type='in' THEN qty ELSE 0 END), 0) AS total_qty_in
    FROM main_stock
    WHERE stock_item_id = ?`,
    [stockItemId]
  );

  const correctStock = Number(calc?.correct_stock || 0);
  const totalCostIn = Number(calc?.total_cost_in || 0);
  const totalQtyIn = Number(calc?.total_qty_in || 0);
  const avgPrice = totalQtyIn > 0 ? Math.round(totalCostIn / totalQtyIn) : 0;

  await conn.query(
    `UPDATE stock_items
     SET stock = ?,
         price_per_unit = ?,
         total_price = ?
     WHERE id = ?`,
    [correctStock, avgPrice, correctStock * avgPrice, stockItemId]
  );

  return { correctStock, avgPrice };
}

function normalizeStatusFilter(status) {
  if (!status) return [];
  return String(status)
    .split(',')
    .map((value) => value.trim())
    .filter((value) => VALID_STATUSES.includes(value));
}

function appendStatusFilter(sql, params, alias, status) {
  const statuses = normalizeStatusFilter(status);
  if (!statuses.length) return sql;

  const column = alias ? `${alias}.status` : 'status';
  if (statuses.length === 1) {
    params.push(statuses[0]);
    return `${sql} AND ${column} = ?`;
  }

  params.push(...statuses);
  return `${sql} AND ${column} IN (${statuses.map(() => '?').join(', ')})`;
}

function friendlyServerError(res, message) {
  return res.status(500).json({ message });
}

exports.reportIssue = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { stock_item_id, qty, unit, reason, description, comments, metadata } = req.body;
    const branchId = getRequestBranchId(req) || req.user.default_branch_id || req.user.branch_id;
    const userId = req.user.id;
    const issueQty = Number(qty || 0);

    if (!stock_item_id || !issueQty || !unit || !reason) {
      await conn.rollback();
      return res.status(400).json({ message: 'Lengkapi bahan, jumlah, satuan, dan alasan sisa stok.' });
    }

    if (issueQty <= 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Jumlah sisa stok harus lebih dari 0.' });
    }

    if (!VALID_REASONS.includes(reason)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Alasan sisa stok tidak valid.' });
    }

    if (!branchId) {
      await conn.rollback();
      return res.status(400).json({ message: 'Cabang aktif belum dipilih.' });
    }

    const [[item]] = await conn.query(
      `SELECT
        si.id,
        si.name,
        si.unit,
        COALESCE(SUM(CASE WHEN ms.type='in' THEN ms.qty ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN ms.type='out' THEN ms.qty ELSE 0 END), 0) AS current_stock
       FROM stock_items si
       LEFT JOIN main_stock ms ON ms.stock_item_id = si.id AND ms.branch_id = ?
       WHERE si.id = ?
       GROUP BY si.id, si.name, si.unit`,
      [branchId, stock_item_id]
    );

    if (!item) {
      await conn.rollback();
      return res.status(404).json({ message: 'Bahan baku tidak ditemukan.' });
    }

    if (issueQty > Number(item.current_stock || 0)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Jumlah sisa stok melebihi stok gudang cabang saat ini.' });
    }

    const issueCode = `SI-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

    const [result] = await conn.query(
      `INSERT INTO stock_issues (
        issue_code, branch_id, stock_item_id, qty, unit, reason,
        description, comments, reported_by, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        issueCode,
        branchId,
        stock_item_id,
        issueQty,
        unit,
        reason,
        description || null,
        comments || null,
        userId,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    await conn.commit();

    res.status(201).json({
      id: result.insertId,
      issue_code: issueCode,
      message: 'Sisa stok berhasil dicatat.',
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error reporting stock issue:', err);
    friendlyServerError(res, 'Gagal mencatat sisa stok.');
  } finally {
    conn.release();
  }
};

exports.getIssues = async (req, res) => {
  try {
    const { status, reason, resolved, page = 1, limit = 20 } = req.query;
    const branchId = getRequestBranchId(req) || req.user.default_branch_id || req.user.branch_id;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));

    let sql = `
      SELECT
        si.id,
        si.issue_code,
        si.stock_item_id,
        si.branch_id,
        si.qty,
        si.unit,
        si.reason,
        si.description,
        si.comments,
        si.status,
        si.resolved,
        si.reported_at,
        si.resolved_at,
        si.resolution_notes,
        si.related_main_stock_id,
        sit.name AS item_name,
        ur.name AS reported_by_name,
        urez.name AS resolved_by_name
      FROM stock_issues si
      JOIN stock_items sit ON si.stock_item_id = sit.id
      JOIN users ur ON si.reported_by = ur.id
      LEFT JOIN users urez ON si.resolved_by = urez.id
      WHERE si.branch_id = ?
    `;

    const params = [branchId];
    sql = appendStatusFilter(sql, params, 'si', status);

    if (reason && VALID_REASONS.includes(reason)) {
      sql += ' AND si.reason = ?';
      params.push(reason);
    }

    if (resolved !== undefined) {
      sql += ' AND si.resolved = ?';
      params.push(resolved === 'true' ? 1 : 0);
    }

    let countSql = 'SELECT COUNT(*) as count FROM stock_issues WHERE branch_id = ?';
    const countParams = [branchId];
    countSql = appendStatusFilter(countSql, countParams, '', status);

    if (reason && VALID_REASONS.includes(reason)) {
      countSql += ' AND reason = ?';
      countParams.push(reason);
    }

    if (resolved !== undefined) {
      countSql += ' AND resolved = ?';
      countParams.push(resolved === 'true' ? 1 : 0);
    }

    const [[{ count }]] = await db.query(countSql, countParams);
    const offset = (pageNumber - 1) * pageSize;

    sql += ' ORDER BY si.reported_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const [issues] = await db.query(sql, params);

    res.json({
      data: issues,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: Number(count || 0),
        pages: Math.ceil(Number(count || 0) / pageSize),
      },
    });
  } catch (err) {
    console.error('Error fetching stock issues:', err);
    friendlyServerError(res, 'Gagal mengambil data sisa stok.');
  }
};

exports.getIssueDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = getRequestBranchId(req) || req.user.default_branch_id || req.user.branch_id;

    const [[issue]] = await db.query(
      `SELECT
        si.*,
        sit.name AS item_name,
        ur.name AS reported_by_name,
        urez.name AS resolved_by_name
      FROM stock_issues si
      JOIN stock_items sit ON si.stock_item_id = sit.id
      JOIN users ur ON si.reported_by = ur.id
      LEFT JOIN users urez ON si.resolved_by = urez.id
      WHERE si.id = ? AND si.branch_id = ?`,
      [id, branchId]
    );

    if (!issue) {
      return res.status(404).json({ message: 'Data sisa stok tidak ditemukan.' });
    }

    if (issue.metadata && typeof issue.metadata === 'string') {
      try {
        issue.metadata = JSON.parse(issue.metadata);
      } catch {
        issue.metadata = null;
      }
    }

    res.json(issue);
  } catch (err) {
    console.error('Error fetching stock issue detail:', err);
    friendlyServerError(res, 'Gagal mengambil detail sisa stok.');
  }
};

exports.resolveIssue = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const { resolution_notes } = req.body;
    const userId = req.user.id;
    const branchId = getRequestBranchId(req) || req.user.default_branch_id || req.user.branch_id;

    const [[issue]] = await conn.query(
      `SELECT
        si.id,
        si.status,
        si.stock_item_id,
        si.qty,
        si.unit,
        si.reason,
        si.related_main_stock_id,
        sit.name AS item_name,
        COALESCE(sit.price_per_unit, 0) AS cost_per_unit
      FROM stock_issues si
      JOIN stock_items sit ON si.stock_item_id = sit.id
      WHERE si.id = ? AND si.branch_id = ?`,
      [id, branchId]
    );

    if (!issue) {
      await conn.rollback();
      return res.status(404).json({ message: 'Data sisa stok tidak ditemukan.' });
    }

    if (issue.status !== 'reported') {
      await conn.rollback();
      return res.status(400).json({ message: 'Laporan sisa stok sudah diproses.' });
    }

    const [[stockRow]] = await conn.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type='in' THEN qty ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type='out' THEN qty ELSE 0 END), 0) AS current_stock
      FROM main_stock
      WHERE stock_item_id = ? AND branch_id = ?`,
      [issue.stock_item_id, branchId]
    );

    if (Number(stockRow?.current_stock || 0) < Number(issue.qty || 0)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Stok gudang tidak cukup untuk menutup laporan sisa stok ini.' });
    }

    const noteParts = [
      `Sisa stok ${issue.reason}: ${issue.item_name} ${Number(issue.qty || 0)} ${issue.unit}`,
      resolution_notes || null,
    ].filter(Boolean);

    const [movement] = await conn.query(
      `INSERT INTO main_stock
        (stock_item_id, qty, cost_per_unit, type, source, reference_id, note, branch_id, created_by)
       VALUES (?, ?, ?, 'out', 'adjustment', ?, ?, ?, ?)`,
      [
        issue.stock_item_id,
        issue.qty,
        issue.cost_per_unit || 0,
        issue.id,
        noteParts.join(' - '),
        branchId,
        userId,
      ]
    );

    await recalcStockItem(conn, issue.stock_item_id);

    await conn.query(
      `UPDATE stock_issues
       SET status = 'resolved',
           resolved = TRUE,
           resolved_by = ?,
           resolved_at = NOW(),
           resolution_notes = ?,
           related_main_stock_id = ?
       WHERE id = ?`,
      [userId, resolution_notes || null, movement.insertId || null, id]
    );

    await conn.commit();

    res.json({
      message: 'Sisa stok berhasil diselesaikan dan stok gudang dikurangi.',
      id,
      movement_id: movement.insertId || null,
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error resolving stock issue:', err);
    friendlyServerError(res, 'Gagal menyelesaikan sisa stok.');
  } finally {
    conn.release();
  }
};

exports.rejectIssue = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const { rejection_reason } = req.body;
    const branchId = getRequestBranchId(req) || req.user.default_branch_id || req.user.branch_id;

    const [[issue]] = await conn.query(
      'SELECT id, status FROM stock_issues WHERE id = ? AND branch_id = ?',
      [id, branchId]
    );

    if (!issue) {
      await conn.rollback();
      return res.status(404).json({ message: 'Data sisa stok tidak ditemukan.' });
    }

    if (issue.status !== 'reported') {
      await conn.rollback();
      return res.status(400).json({ message: 'Laporan sisa stok sudah diproses.' });
    }

    await conn.query(
      `UPDATE stock_issues
       SET status = 'rejected',
           resolved = FALSE,
           resolution_notes = ?
       WHERE id = ?`,
      [rejection_reason || null, id]
    );

    await conn.commit();

    res.json({
      message: 'Laporan sisa stok ditolak.',
      id,
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error rejecting stock issue:', err);
    friendlyServerError(res, 'Gagal menolak sisa stok.');
  } finally {
    conn.release();
  }
};

exports.getSummary = async (req, res) => {
  try {
    const branchId = getRequestBranchId(req) || req.user.default_branch_id || req.user.branch_id;

    const [[summary]] = await db.query(
      `SELECT
        COUNT(*) as total_issues,
        SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN reason = 'expired' THEN 1 ELSE 0 END) as expired_count,
        SUM(CASE WHEN reason = 'damaged' THEN 1 ELSE 0 END) as damaged_count,
        SUM(CASE WHEN reason = 'lost' THEN 1 ELSE 0 END) as lost_count
      FROM stock_issues
      WHERE branch_id = ?`,
      [branchId]
    );

    res.json(summary || {
      total_issues: 0,
      pending_count: 0,
      resolved_count: 0,
      rejected_count: 0,
      expired_count: 0,
      damaged_count: 0,
      lost_count: 0,
    });
  } catch (err) {
    console.error('Error fetching stock issue summary:', err);
    friendlyServerError(res, 'Gagal mengambil ringkasan sisa stok.');
  }
};
