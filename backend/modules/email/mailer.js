import nodemailer from 'nodemailer';
import { Invoice } from '../../../database/models.js';
import { invoiceEmailTemplate, reminderEmailTemplate } from './templates.js';
import { logInfo, logError } from '../../audit/logger.js';
import auditManager from '../../audit/audit-manager.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Delivery System
 * Handles sending invoices and reminders via email
 */

class Mailer {
    constructor() {
        // Create reusable transporter
        this.transporter = nodemailer.createTransporter({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Verify connection configuration
        this.verifyConnection();
    }

    /**
     * Verify SMTP connection
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            logInfo('Email transporter verified successfully');
        } catch (error) {
            logError('Email transporter verification failed', error);
        }
    }

    /**
     * Send invoice email
     */
    async sendInvoiceEmail(invoiceId) {
        try {
            logInfo('Sending invoice email', { invoice_id: invoiceId });

            // Fetch invoice details
            const invoice = await Invoice.findById(invoiceId);
            if (!invoice) {
                throw new Error(`Invoice ${invoiceId} not found`);
            }

            if (!invoice.pdf_url) {
                throw new Error(`Invoice ${invoiceId} has no PDF URL`);
            }

            // Prepare email
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'BillerAGI <billing@billeragi.com>',
                to: invoice.customer_email,
                subject: `Invoice ${invoice.invoice_number} from BillerAGI`,
                html: invoiceEmailTemplate(
                    invoice.customer_name,
                    invoice.invoice_number,
                    invoice.total_amount,
                    invoice.due_date,
                    invoice.pdf_url
                )
            };

            // Send email
            const info = await this.transporter.sendMail(mailOptions);

            // Update invoice status
            await Invoice.updateStatus(invoiceId, 'sent');

            // Log to audit trail
            await auditManager.logEmailDelivery(
                invoiceId,
                invoice.customer_email,
                'sent',
                {
                    message_id: info.messageId,
                    response: info.response
                }
            );

            logInfo('Invoice email sent successfully', {
                invoice_id: invoiceId,
                message_id: info.messageId,
                recipient: invoice.customer_email
            });

            return {
                success: true,
                message_id: info.messageId,
                recipient: invoice.customer_email
            };
        } catch (error) {
            logError('Failed to send invoice email', error, { invoice_id: invoiceId });

            // Log failed delivery
            await auditManager.logEmailDelivery(
                invoiceId,
                'unknown',
                'failed',
                {
                    error: error.message
                }
            );

            throw error;
        }
    }

    /**
     * Send payment reminder email
     */
    async sendReminderEmail(invoiceId) {
        try {
            logInfo('Sending payment reminder', { invoice_id: invoiceId });

            // Fetch invoice details
            const invoice = await Invoice.findById(invoiceId);
            if (!invoice) {
                throw new Error(`Invoice ${invoiceId} not found`);
            }

            // Calculate days overdue
            const dueDate = new Date(invoice.due_date);
            const today = new Date();
            const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

            if (daysOverdue <= 0) {
                logInfo('Invoice not overdue, skipping reminder', { invoice_id: invoiceId });
                return { success: false, reason: 'not_overdue' };
            }

            // Prepare email
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'BillerAGI <billing@billeragi.com>',
                to: invoice.customer_email,
                subject: `Payment Reminder: Invoice ${invoice.invoice_number} - ${daysOverdue} Days Overdue`,
                html: reminderEmailTemplate(
                    invoice.customer_name,
                    invoice.invoice_number,
                    invoice.total_amount,
                    invoice.due_date,
                    daysOverdue,
                    invoice.pdf_url
                )
            };

            // Send email
            const info = await this.transporter.sendMail(mailOptions);

            // Update invoice status to overdue if not already
            if (invoice.status !== 'overdue') {
                await Invoice.updateStatus(invoiceId, 'overdue');
            }

            // Log reminder sent
            await auditManager.logReminderSent(
                invoiceId,
                invoice.customer_id,
                `${daysOverdue}-day reminder`,
                {
                    days_overdue: daysOverdue,
                    message_id: info.messageId
                }
            );

            logInfo('Payment reminder sent successfully', {
                invoice_id: invoiceId,
                days_overdue: daysOverdue,
                message_id: info.messageId
            });

            return {
                success: true,
                message_id: info.messageId,
                days_overdue: daysOverdue,
                recipient: invoice.customer_email
            };
        } catch (error) {
            logError('Failed to send payment reminder', error, { invoice_id: invoiceId });
            throw error;
        }
    }

    /**
     * Send batch invoice emails
     */
    async sendBatchInvoices(invoiceIds) {
        const results = [];

        for (const invoiceId of invoiceIds) {
            try {
                const result = await this.sendInvoiceEmail(invoiceId);
                results.push({ invoice_id: invoiceId, success: true, result });
            } catch (error) {
                results.push({ invoice_id: invoiceId, success: false, error: error.message });
            }

            // Add delay to avoid rate limiting
            await this.delay(1000);
        }

        return results;
    }

    /**
     * Send batch reminders
     */
    async sendBatchReminders(invoiceIds) {
        const results = [];

        for (const invoiceId of invoiceIds) {
            try {
                const result = await this.sendReminderEmail(invoiceId);
                results.push({ invoice_id: invoiceId, success: true, result });
            } catch (error) {
                results.push({ invoice_id: invoiceId, success: false, error: error.message });
            }

            // Add delay to avoid rate limiting
            await this.delay(1000);
        }

        return results;
    }

    /**
     * Send test email
     */
    async sendTestEmail(recipientEmail) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'BillerAGI <billing@billeragi.com>',
                to: recipientEmail,
                subject: 'BillerAGI Email Test',
                html: '<h1>Email Configuration Test</h1><p>If you receive this email, your email configuration is working correctly!</p>'
            };

            const info = await this.transporter.sendMail(mailOptions);

            logInfo('Test email sent successfully', {
                message_id: info.messageId,
                recipient: recipientEmail
            });

            return {
                success: true,
                message_id: info.messageId
            };
        } catch (error) {
            logError('Test email failed', error);
            throw error;
        }
    }

    /**
     * Helper: Add delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get email delivery statistics
     */
    async getDeliveryStats() {
        try {
            const allInvoices = await Invoice.findAll(1000, 0);

            const stats = {
                total_sent: allInvoices.filter(i => i.status === 'sent' || i.status === 'paid').length,
                total_pending: allInvoices.filter(i => i.status === 'pending' || i.status === 'validated').length,
                total_overdue: allInvoices.filter(i => i.status === 'overdue').length
            };

            return stats;
        } catch (error) {
            logError('Failed to get delivery stats', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new Mailer();
