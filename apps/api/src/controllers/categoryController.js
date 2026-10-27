const db = require('../config/db');
const { getTenantId, isSuperAdmin } = require('../utils/tenantContext');

exports.getAll = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const isSuper = isSuperAdmin(req);
    const [rows] = await db.query(
      'SELECT * FROM categories WHERE (? = true OR tenant_id = ?) ORDER BY name',
      [isSuper, tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    const tenantId = getTenantId(req);
    const [result] = await db.query('INSERT INTO categories (name, tenant_id) VALUES (?, ?)', [name, tenantId]);
    res.status(201).json({ message: 'Kategori ditambahkan', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const isSuper = isSuperAdmin(req);
    const [result] = await db.query('DELETE FROM categories WHERE id = ? AND (? = true OR tenant_id = ?)', [req.params.id, isSuper, tenantId]);
    if (!result.affectedRows)
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    res.json({ message: 'Kategori dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};