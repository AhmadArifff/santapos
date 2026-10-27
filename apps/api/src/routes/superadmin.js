const router = require('express').Router();
const {
  getStats,
  getTenants,
  updateTenantPlan,
  updateTenantStatus,
} = require('../controllers/superadminController');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

router.use(authenticate, isSuperAdmin);

router.get('/stats', getStats);
router.get('/tenants', getTenants);
router.patch('/tenants/:id/plan', updateTenantPlan);
router.patch('/tenants/:id/status', updateTenantStatus);

module.exports = router;
