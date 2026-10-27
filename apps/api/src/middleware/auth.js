const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token tidak ada' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    if (req.user?.tenant_id) {
      req.tenantId = Number(req.user.tenant_id);
    }
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Akses ditolak' });
  }
  next();
};

exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Akses khusus Super Admin Santapos' });
  }
  next();
};