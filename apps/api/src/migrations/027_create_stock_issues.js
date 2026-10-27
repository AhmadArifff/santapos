// Migration: Create stock_issues table for tracking stock problems
// Purpose: Centralized management of stock issues (expired, damaged, lost, other)
// with audit trail and resolution workflow

exports.up = async (db) => {
  // Create stock_issues table to track problematic stock items
  await db.query(`
    CREATE TABLE IF NOT EXISTS stock_issues (
      id INT AUTO_INCREMENT PRIMARY KEY,
      
      -- Issue identification
      issue_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Unique issue identifier (e.g., SI-1720777600000)',
      
      -- Stock and branch reference
      branch_id INT NOT NULL COMMENT 'Branch where issue occurred',
      stock_item_id INT NOT NULL COMMENT 'Reference to stock_items (bahan/ingredient)',
      
      -- Quantity and unit tracking
      qty DECIMAL(10, 2) NOT NULL COMMENT 'Quantity of stock with issue',
      unit VARCHAR(20) NOT NULL COMMENT 'Unit of measurement (pcs, kg, liter, etc)',
      
      -- Issue details
      reason ENUM('expired', 'damaged', 'lost', 'other') NOT NULL DEFAULT 'other' 
        COMMENT 'Category of stock issue',
      description TEXT NULL COMMENT 'Detailed description of the issue',
      comments TEXT NULL COMMENT 'Additional comments',
      
      -- Reporting information
      reported_by INT NOT NULL COMMENT 'User ID who reported the issue',
      reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When issue was reported',
      
      -- Resolution tracking
      status ENUM('reported', 'resolved', 'rejected') NOT NULL DEFAULT 'reported'
        COMMENT 'Current status of the issue',
      resolved BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether issue has been resolved',
      resolved_by INT NULL COMMENT 'User ID who resolved the issue',
      resolved_at TIMESTAMP NULL COMMENT 'When issue was resolved',
      resolution_notes TEXT NULL COMMENT 'Notes about how issue was resolved',
      
      -- Linkage to inventory transactions
      related_main_stock_id INT NULL COMMENT 'Links to main_stock record if adjustment was made',
      
      -- Flexible metadata storage
      metadata JSON NULL COMMENT 'Additional data: batch_number, expiry_date, purchase_date, etc',
      
      -- Audit timestamps
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Foreign key constraints
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
      FOREIGN KEY (stock_item_id) REFERENCES stock_items(id) ON DELETE RESTRICT,
      FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (related_main_stock_id) REFERENCES main_stock(id) ON DELETE SET NULL,
      
      -- Indexes for optimal query performance
      INDEX idx_branch (branch_id),
      INDEX idx_stock_item (stock_item_id),
      INDEX idx_reason (reason),
      INDEX idx_status (status),
      INDEX idx_reported_at (reported_at DESC),
      INDEX idx_resolved (resolved),
      INDEX idx_reported_by (reported_by),
      INDEX idx_branch_status_reason (branch_id, status, reason),
      INDEX idx_stock_item_resolved_at (stock_item_id, resolved_at DESC),
      UNIQUE INDEX idx_issue_code (issue_code)
      
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='Tracks problematic stock items (expired, damaged, lost) with full audit trail'
  `);

  console.log('✓ Created stock_issues table');
};

exports.down = async (db) => {
  // Rollback: remove stock_issues table
  await db.query(`
    DROP TABLE IF EXISTS stock_issues
  `);

  console.log('✓ Dropped stock_issues table');
};
