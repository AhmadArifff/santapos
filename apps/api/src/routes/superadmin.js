const router = require('express').Router();
const {
  getStats,
  getTenants,
  updateTenantPlan,
  updateTenantStatus,
  getDatabaseConfig,
  testDatabaseConnection,
  updateDatabaseConfig,
  pingDatabaseKeepAlive,
} = require('../controllers/superadminController');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

router.use(authenticate, isSuperAdmin);

router.get('/stats', getStats);
router.get('/tenants', getTenants);
router.patch('/tenants/:id/plan', updateTenantPlan);
router.patch('/tenants/:id/status', updateTenantStatus);

// Database & Cloud Storage Settings
router.get('/database', getDatabaseConfig);
router.post('/database/test', testDatabaseConnection);
router.post('/database/save', updateDatabaseConfig);
router.post('/database/ping', pingDatabaseKeepAlive);

module.exports = router;
