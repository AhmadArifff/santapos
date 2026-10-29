const router = require('express').Router();
const c = require('../controllers/paymentController');
const { authenticate, isAdmin } = require('../middleware/auth');
const paymentUpload = require('../middleware/paymentUpload');

// Manual Payment Methods
router.get('/public', c.listPublicMethods);
router.get('/', authenticate, isAdmin, c.listMethods);
router.post('/', authenticate, isAdmin, paymentUpload.single('qr_image'), c.createMethod);
router.put('/:id', authenticate, isAdmin, paymentUpload.single('qr_image'), c.updateMethod);
router.delete('/:id', authenticate, isAdmin, c.deleteMethod);

// Midtrans Payment Gateway & Financial Security Endpoints
router.get('/midtrans/config', authenticate, isAdmin, c.getMidtransConfig);
router.post('/midtrans/config', authenticate, isAdmin, c.saveMidtransConfig);
router.post('/midtrans/test', authenticate, isAdmin, c.testMidtransConfig);
router.post('/midtrans/snap/:orderCode', c.createMidtransSnapToken); // Public for customers paying their QR order
router.post('/midtrans/notification', c.handleMidtransNotification); // Webhook endpoint called by Midtrans
router.get('/midtrans/audit-logs', authenticate, isAdmin, c.getMidtransAuditLogs); // Financial Audit Trail
router.get('/midtrans/status/:orderCode', authenticate, c.checkOrderStatus); // Real-time status query from Midtrans API
router.post('/midtrans/sync', authenticate, isAdmin, c.syncMidtransRange); // Reconciliation sync by date range
router.post('/midtrans/manual-approve/:orderCode', authenticate, isAdmin, c.manualApprovePayment); // Manual fallback approve paid

module.exports = router;
