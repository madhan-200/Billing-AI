import express from 'express';
import { Payment, Invoice } from '../database/models.js';
import { authenticateToken } from '../middleware/auth.js';
import auditManager from '../modules/audit/audit-manager.js';
import { logError } from '../modules/audit/logger.js';

const router = express.Router();

/**
 * Get all payments
 * GET /api/payments
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const payments = await Payment.findAll();

        res.json({
            success: true,
            count: payments.length,
            payments
        });
    } catch (error) {
        logError('Failed to fetch payments', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payments'
        });
    }
});

/**
 * Get payments for an invoice
 * GET /api/payments/invoice/:invoiceId
 */
router.get('/invoice/:invoiceId', authenticateToken, async (req, res) => {
    try {
        const payments = await Payment.findByInvoiceId(req.params.invoiceId);

        res.json({
            success: true,
            count: payments.length,
            payments
        });
    } catch (error) {
        logError('Failed to fetch payments for invoice', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payments'
        });
    }
});

/**
 * Record a payment
 * POST /api/payments
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { invoice_id, amount, payment_method, transaction_id, notes } = req.body;

        if (!invoice_id || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Invoice ID and amount are required'
            });
        }

        // Create payment
        const payment = await Payment.create({
            invoice_id,
            payment_date: new Date().toISOString().split('T')[0],
            amount,
            payment_method,
            transaction_id,
            notes
        });

        // Update invoice status to paid
        await Invoice.updateStatus(invoice_id, 'paid');

        // Log payment
        await auditManager.logPaymentReceived(
            payment.id,
            invoice_id,
            amount,
            {
                payment_method,
                transaction_id,
                recorded_by: req.user.id
            }
        );

        res.status(201).json({
            success: true,
            payment
        });
    } catch (error) {
        logError('Failed to record payment', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record payment'
        });
    }
});

export default router;
