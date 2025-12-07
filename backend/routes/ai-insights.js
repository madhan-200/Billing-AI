import express from 'express';
import { AIValidationLog, Invoice } from '../database/models.js';
import { authenticateToken } from '../middleware/auth.js';
import aiValidator from '../modules/ai/validation/validator.js';
import clientAssistant from '../modules/ai/assistant/assistant.js';
import { logError } from '../modules/audit/logger.js';

const router = express.Router();

/**
 * Get AI validation reports
 * GET /api/insights/validation
 */
router.get('/validation', authenticateToken, async (req, res) => {
    try {
        const flaggedValidations = await AIValidationLog.findFlagged();
        const stats = await aiValidator.getValidationStats();

        res.json({
            success: true,
            stats,
            flagged_invoices: flaggedValidations
        });
    } catch (error) {
        logError('Failed to fetch validation insights', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch validation insights'
        });
    }
});

/**
 * Get billing trends analysis
 * GET /api/insights/trends
 */
router.get('/trends', authenticateToken, async (req, res) => {
    try {
        const allInvoices = await Invoice.findAll(1000, 0);

        // Calculate trends
        const totalRevenue = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
        const avgInvoiceAmount = totalRevenue / allInvoices.length;

        const statusBreakdown = allInvoices.reduce((acc, inv) => {
            acc[inv.status] = (acc[inv.status] || 0) + 1;
            return acc;
        }, {});

        const monthlyRevenue = allInvoices.reduce((acc, inv) => {
            const month = inv.issue_date.substring(0, 7); // YYYY-MM
            acc[month] = (acc[month] || 0) + parseFloat(inv.total_amount);
            return acc;
        }, {});

        res.json({
            success: true,
            trends: {
                total_revenue: totalRevenue.toFixed(2),
                total_invoices: allInvoices.length,
                average_invoice_amount: avgInvoiceAmount.toFixed(2),
                status_breakdown: statusBreakdown,
                monthly_revenue: monthlyRevenue
            }
        });
    } catch (error) {
        logError('Failed to fetch billing trends', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch billing trends'
        });
    }
});

/**
 * Handle client query with AI
 * POST /api/insights/query
 */
router.post('/query', async (req, res) => {
    try {
        const { customer_id, query_text, invoice_id } = req.body;

        if (!customer_id || !query_text) {
            return res.status(400).json({
                success: false,
                error: 'Customer ID and query text are required'
            });
        }

        const result = await clientAssistant.handleQuery(
            customer_id,
            query_text,
            invoice_id || null
        );

        res.json({
            success: true,
            result
        });
    } catch (error) {
        logError('Failed to handle client query', error);
        res.status(500).json({
            success: false,
            error: 'Failed to handle query'
        });
    }
});

/**
 * Get client query statistics
 * GET /api/insights/query-stats
 */
router.get('/query-stats', authenticateToken, async (req, res) => {
    try {
        const stats = await clientAssistant.getQueryStats();
        const commonTypes = await clientAssistant.getCommonQueryTypes();

        res.json({
            success: true,
            stats,
            common_query_types: commonTypes
        });
    } catch (error) {
        logError('Failed to fetch query stats', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch query stats'
        });
    }
});

/**
 * Get AI-powered billing suggestions
 * GET /api/insights/suggestions
 */
router.get('/suggestions', authenticateToken, async (req, res) => {
    try {
        const flaggedValidations = await AIValidationLog.findFlagged();
        const overdueInvoices = await Invoice.findOverdue();

        const suggestions = [];

        // Suggestion 1: Flagged invoices need review
        if (flaggedValidations.length > 0) {
            suggestions.push({
                type: 'validation_review',
                priority: 'high',
                message: `${flaggedValidations.length} invoices flagged by AI validation require manual review`,
                action: 'Review flagged invoices',
                count: flaggedValidations.length
            });
        }

        // Suggestion 2: Overdue invoices need follow-up
        if (overdueInvoices.length > 0) {
            const criticalOverdue = overdueInvoices.filter(inv => {
                const dueDate = new Date(inv.due_date);
                const daysOverdue = Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24));
                return daysOverdue > 30;
            });

            if (criticalOverdue.length > 0) {
                suggestions.push({
                    type: 'overdue_critical',
                    priority: 'critical',
                    message: `${criticalOverdue.length} invoices are over 30 days overdue`,
                    action: 'Contact customers immediately',
                    count: criticalOverdue.length
                });
            }
        }

        // Suggestion 3: AI automation success rate
        const validationStats = await aiValidator.getValidationStats();
        const automationRate = (validationStats.total_validated / (validationStats.total_validated + validationStats.total_flagged) * 100).toFixed(2);

        suggestions.push({
            type: 'automation_performance',
            priority: 'info',
            message: `AI automation handling ${automationRate}% of invoices automatically`,
            action: 'Monitor AI performance',
            automation_rate: automationRate
        });

        res.json({
            success: true,
            suggestions
        });
    } catch (error) {
        logError('Failed to generate suggestions', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate suggestions'
        });
    }
});

export default router;
