import { AuditLog } from '../../database/models.js';
import { auditLogger } from './logger.js';

/**
 * Audit Manager - Centralized logging for all billing activities
 * Ensures compliance-ready audit trails
 */

class AuditManager {
    /**
     * Log an action to both database and file system
     */
    async logAction(actionData) {
        const {
            action_type,
            entity_type,
            entity_id,
            user_type = 'system',
            user_id = null,
            description,
            metadata = {},
            ip_address = null
        } = actionData;

        try {
            // Log to database
            const auditEntry = await AuditLog.create({
                action_type,
                entity_type,
                entity_id,
                user_type,
                user_id,
                description,
                metadata,
                ip_address
            });

            // Log to file system
            auditLogger.info('Audit Log Entry', {
                id: auditEntry.id,
                action_type,
                entity_type,
                entity_id,
                user_type,
                user_id,
                description,
                metadata,
                timestamp: auditEntry.created_at
            });

            return auditEntry;
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Still log to file even if database fails
            auditLogger.error('Audit Log Failed', {
                action_type,
                entity_type,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Log invoice generation
     */
    async logInvoiceGeneration(invoiceId, customerId, contractId, metadata = {}) {
        return this.logAction({
            action_type: 'INVOICE_GENERATED',
            entity_type: 'invoice',
            entity_id: invoiceId,
            description: `Invoice generated for customer ${customerId} from contract ${contractId}`,
            metadata: {
                customer_id: customerId,
                contract_id: contractId,
                ...metadata
            }
        });
    }

    /**
     * Log AI validation decision
     */
    async logAIValidation(invoiceId, validationResult, metadata = {}) {
        return this.logAction({
            action_type: 'AI_VALIDATION',
            entity_type: 'invoice',
            entity_id: invoiceId,
            user_type: 'ai',
            user_id: 'gemini-validator',
            description: `AI validation completed with status: ${validationResult.status}`,
            metadata: {
                validation_status: validationResult.status,
                anomaly_score: validationResult.anomaly_score,
                flags: validationResult.flags,
                ...metadata
            }
        });
    }

    /**
     * Log email delivery
     */
    async logEmailDelivery(invoiceId, recipientEmail, status, metadata = {}) {
        return this.logAction({
            action_type: 'EMAIL_SENT',
            entity_type: 'invoice',
            entity_id: invoiceId,
            description: `Invoice email sent to ${recipientEmail} with status: ${status}`,
            metadata: {
                recipient: recipientEmail,
                delivery_status: status,
                ...metadata
            }
        });
    }

    /**
     * Log payment received
     */
    async logPaymentReceived(paymentId, invoiceId, amount, metadata = {}) {
        return this.logAction({
            action_type: 'PAYMENT_RECEIVED',
            entity_type: 'payment',
            entity_id: paymentId,
            description: `Payment of $${amount} received for invoice ${invoiceId}`,
            metadata: {
                invoice_id: invoiceId,
                amount,
                ...metadata
            }
        });
    }

    /**
     * Log client query handling
     */
    async logClientQuery(queryId, customerId, queryType, aiHandled, metadata = {}) {
        return this.logAction({
            action_type: 'CLIENT_QUERY',
            entity_type: 'client_query',
            entity_id: queryId,
            user_type: aiHandled ? 'ai' : 'customer',
            user_id: customerId,
            description: `Client query of type ${queryType} ${aiHandled ? 'handled by AI' : 'escalated to human'}`,
            metadata: {
                customer_id: customerId,
                query_type: queryType,
                ai_handled: aiHandled,
                ...metadata
            }
        });
    }

    /**
     * Log reminder sent
     */
    async logReminderSent(invoiceId, customerId, reminderType, metadata = {}) {
        return this.logAction({
            action_type: 'REMINDER_SENT',
            entity_type: 'invoice',
            entity_id: invoiceId,
            description: `${reminderType} reminder sent for overdue invoice`,
            metadata: {
                customer_id: customerId,
                reminder_type: reminderType,
                ...metadata
            }
        });
    }

    /**
     * Log admin action
     */
    async logAdminAction(adminId, actionType, entityType, entityId, description, metadata = {}) {
        return this.logAction({
            action_type: actionType,
            entity_type: entityType,
            entity_id: entityId,
            user_type: 'admin',
            user_id: adminId,
            description,
            metadata
        });
    }

    /**
     * Log system error
     */
    async logSystemError(errorType, description, metadata = {}) {
        return this.logAction({
            action_type: 'SYSTEM_ERROR',
            entity_type: 'system',
            user_type: 'system',
            description,
            metadata: {
                error_type: errorType,
                ...metadata
            }
        });
    }

    /**
     * Get audit logs with filters
     */
    async getAuditLogs(filters = {}, limit = 100) {
        try {
            return await AuditLog.findAll(filters, limit);
        } catch (error) {
            console.error('Failed to retrieve audit logs:', error);
            throw error;
        }
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(startDate, endDate) {
        try {
            const logs = await AuditLog.findAll({}, 10000);

            // Filter by date range
            const filteredLogs = logs.filter(log => {
                const logDate = new Date(log.created_at);
                return logDate >= new Date(startDate) && logDate <= new Date(endDate);
            });

            // Group by action type
            const summary = filteredLogs.reduce((acc, log) => {
                acc[log.action_type] = (acc[log.action_type] || 0) + 1;
                return acc;
            }, {});

            return {
                period: { start: startDate, end: endDate },
                total_actions: filteredLogs.length,
                summary,
                logs: filteredLogs
            };
        } catch (error) {
            console.error('Failed to generate compliance report:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new AuditManager();
