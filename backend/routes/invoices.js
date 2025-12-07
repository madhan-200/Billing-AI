import express from 'express';
import { Invoice } from '../database/models.js';
import { authenticateToken } from '../middleware/auth.js';
import invoiceGenerator from '../modules/invoice/generator.js';
import invoiceStorage from '../modules/invoice/storage.js';
import aiValidator from '../modules/ai/validation/validator.js';
import mailer from '../modules/email/mailer.js';
import auditManager from '../modules/audit/audit-manager.js';
import { logError } from '../modules/audit/logger.js';

const router = express.Router();

/**
 * Get all invoices
 * GET /api/invoices
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        const invoices = await Invoice.findAll(limit, offset);

        res.json({
            success: true,
            count: invoices.length,
            invoices
        });
    } catch (error) {
        logError('Failed to fetch invoices', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch invoices'
        });
    }
});

/**
 * Get invoice by ID
 * GET /api/invoices/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Invoice not found'
            });
        }

        res.json({
            success: true,
            invoice
        });
    } catch (error) {
        logError('Failed to fetch invoice', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch invoice'
        });
    }
});

/**
 * Get invoices by status
 * GET /api/invoices/status/:status
 */
router.get('/status/:status', authenticateToken, async (req, res) => {
    try {
        const invoices = await Invoice.findByStatus(req.params.status);

        res.json({
            success: true,
            count: invoices.length,
            invoices
        });
    } catch (error) {
        logError('Failed to fetch invoices by status', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch invoices'
        });
    }
});

/**
 * Get overdue invoices
 * GET /api/invoices/overdue/list
 */
router.get('/overdue/list', authenticateToken, async (req, res) => {
    try {
        const invoices = await Invoice.findOverdue();

        res.json({
            success: true,
            count: invoices.length,
            invoices
        });
    } catch (error) {
        logError('Failed to fetch overdue invoices', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch overdue invoices'
        });
    }
});

/**
 * Create manual invoice
 * POST /api/invoices
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const invoice = await Invoice.create(req.body);

        // Log action
        await auditManager.logAdminAction(
            req.user.id,
            'INVOICE_CREATED',
            'invoice',
            invoice.id,
            'Manual invoice creation',
            { invoice_number: invoice.invoice_number }
        );

        res.status(201).json({
            success: true,
            invoice
        });
    } catch (error) {
        logError('Failed to create invoice', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create invoice'
        });
    }
});

/**
 * Update invoice status
 * PATCH /api/invoices/:id/status
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Status is required'
            });
        }

        const invoice = await Invoice.updateStatus(req.params.id, status);

        // Log action
        await auditManager.logAdminAction(
            req.user.id,
            'INVOICE_STATUS_UPDATED',
            'invoice',
            invoice.id,
            `Invoice status updated to ${status}`,
            { old_status: invoice.status, new_status: status }
        );

        res.json({
            success: true,
            invoice
        });
    } catch (error) {
        logError('Failed to update invoice status', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update invoice status'
        });
    }
});

/**
 * Generate PDF for invoice
 * POST /api/invoices/:id/generate-pdf
 */
router.post('/:id/generate-pdf', authenticateToken, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Invoice not found'
            });
        }

        // Generate PDF
        const pdfBuffer = await invoiceGenerator.generatePDF(req.params.id);

        // Upload to Cloudinary
        const uploadResult = await invoiceStorage.uploadAndUpdateInvoice(
            req.params.id,
            pdfBuffer,
            invoice.invoice_number
        );

        res.json({
            success: true,
            pdf_url: uploadResult.url,
            message: 'PDF generated and uploaded successfully'
        });
    } catch (error) {
        logError('Failed to generate PDF', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate PDF'
        });
    }
});

/**
 * Validate invoice with AI
 * POST /api/invoices/:id/validate
 */
router.post('/:id/validate', authenticateToken, async (req, res) => {
    try {
        const validationResult = await aiValidator.validateInvoice(req.params.id);

        res.json({
            success: true,
            validation: validationResult
        });
    } catch (error) {
        logError('Failed to validate invoice', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate invoice'
        });
    }
});

/**
 * Send invoice email
 * POST /api/invoices/:id/send
 */
router.post('/:id/send', authenticateToken, async (req, res) => {
    try {
        const result = await mailer.sendInvoiceEmail(req.params.id);

        res.json({
            success: true,
            result
        });
    } catch (error) {
        logError('Failed to send invoice', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send invoice'
        });
    }
});

/**
 * Download invoice PDF
 * GET /api/invoices/:id/pdf
 */
router.get('/:id/pdf', authenticateToken, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Invoice not found'
            });
        }

        if (!invoice.pdf_url) {
            return res.status(404).json({
                success: false,
                error: 'PDF not available for this invoice'
            });
        }

        // Redirect to Cloudinary URL
        res.redirect(invoice.pdf_url);
    } catch (error) {
        logError('Failed to download PDF', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download PDF'
        });
    }
});

export default router;
