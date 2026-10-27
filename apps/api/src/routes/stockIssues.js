const router = require('express').Router();
const c = require('../controllers/stockIssueController');
const { authenticate, isAdmin } = require('../middleware/auth');

// ── Stock Issue Management Routes ──────────────────────────────

// Report a new stock issue (any user)
router.post('/', authenticate, c.reportIssue);

// Get all stock issues with filters (user can see their branch only)
router.get('/', authenticate, c.getIssues);

// Get summary/dashboard of stock issues by branch
router.get('/summary', authenticate, c.getSummary);

// Get detail of a specific stock issue
router.get('/:id', authenticate, c.getIssueDetail);

// Resolve a stock issue (admin only)
router.put('/:id/resolve', authenticate, isAdmin, c.resolveIssue);

// Reject a stock issue (admin only)
router.put('/:id/reject', authenticate, isAdmin, c.rejectIssue);

module.exports = router;
