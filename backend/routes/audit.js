import express from 'express';
import { AuditLog } from '../database/models.js';
import { authenticateToken } from '../middleware/auth.js';
import auditManager from '../modules/audit/audit-manager.js';
import { logError } from '../modules/audit/logger.js';

const router = express.Router();

/**
 * Get audit logs
 * GET /api/audit/logs
 */
router.get('/logs', authenticateToken, async (req, res) => {
    try {
        const filters = {};

        if (req.query.entity_type) {
            filters.entity_type = req.query.entity_type;
        }

        if (req.query.action_type) {
            filters.action_type = req.query.action_type;
        }

        const limit = parseInt(req.query.limit) || 100;
        const logs = await AuditLog.findAll(filters, limit);

        res.json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (error) {
        logError('Failed to fetch audit logs', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit logs'
        });
    }
});

/**
 * Get AI decision logs
 * GET /api/audit/ai-decisions
 */
router.get('/ai-decisions', authenticateToken, async (req, res) => {
    try {
        const logs = await AuditLog.findAll({ user_type: 'ai' }, 100);

        res.json({
            success: true,
            count: logs.length,
            ai_decisions: logs
        });
    } catch (error) {
        logError('Failed to fetch AI decision logs', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch AI decision logs'
        });
    }
});

/**
 * Generate compliance report
 * POST /api/audit/compliance-report
 */
router.post('/compliance-report', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date } = req.body;

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }

        const report = await auditManager.generateComplianceReport(start_date, end_date);

        res.json({
            success: true,
            report
        });
    } catch (error) {
        logError('Failed to generate compliance report', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate compliance report'
        });
    }
});

export default router;
