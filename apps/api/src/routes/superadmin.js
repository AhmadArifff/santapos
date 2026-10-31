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
  migrateDatabaseAndStorage,
  getCrmDeals,
  createCrmDeal,
  updateCrmDeal,
  deleteCrmDeal,
} = require('../controllers/superadminController');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

router.use(authenticate, isSuperAdmin);

router.get('/stats', getStats);
router.get('/tenants', getTenants);
router.patch('/tenants/:id/plan', updateTenantPlan);
router.patch('/tenants/:id/status', updateTenantStatus);

// SaaS CRM Deal Pipeline & Kanban Board
router.get('/crm-deals', getCrmDeals);
router.post('/crm-deals', createCrmDeal);
router.patch('/crm-deals/:id', updateCrmDeal);
router.delete('/crm-deals/:id', deleteCrmDeal);

// Database & Cloud Storage Settings
router.get('/database', getDatabaseConfig);
router.post('/database/test', testDatabaseConnection);
router.post('/database/save', updateDatabaseConfig);
router.post('/database/ping', pingDatabaseKeepAlive);
router.post('/database/migrate', migrateDatabaseAndStorage);

module.exports = router;
