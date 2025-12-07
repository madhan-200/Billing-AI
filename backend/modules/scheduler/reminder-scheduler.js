import cron from 'node-cron';
import { Invoice } from '../../../database/models.js';
import mailer from '../email/mailer.js';
import { logInfo, logError } from '../audit/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Payment Reminder Scheduler
 * Automated reminders for overdue invoices
 */

class ReminderScheduler {
    constructor() {
        this.isRunning = false;
        this.cronSchedule = process.env.REMINDER_CRON_SCHEDULE || '0 10 * * *'; // Default: 10 AM daily
    }

    /**
     * Start the reminder scheduler
     */
    start() {
        logInfo('Starting reminder scheduler', { schedule: this.cronSchedule });

        // Schedule daily reminder job
        cron.schedule(this.cronSchedule, async () => {
            await this.executeReminderCycle();
        });

        logInfo('Reminder scheduler started successfully');
    }

    /**
     * Execute reminder cycle
     */
    async executeReminderCycle() {
        if (this.isRunning) {
            logInfo('Reminder cycle already running, skipping...');
            return;
        }

        this.isRunning = true;
        logInfo('Starting reminder cycle execution');

        try {
            // Find all overdue invoices
            const overdueInvoices = await Invoice.findOverdue();
            logInfo(`Found ${overdueInvoices.length} overdue invoices`);

            if (overdueInvoices.length === 0) {
                logInfo('No overdue invoices found');
                this.isRunning = false;
                return;
            }

            const results = {
                total: overdueInvoices.length,
                reminders_sent: 0,
                skipped: 0,
                failed: 0,
                by_urgency: {
                    low: 0,      // 1-7 days overdue
                    medium: 0,   // 8-14 days overdue
                    high: 0,     // 15-30 days overdue
                    critical: 0  // 30+ days overdue
                }
            };

            // Process each overdue invoice
            for (const invoice of overdueInvoices) {
                try {
                    await this.processOverdueInvoice(invoice, results);
                } catch (error) {
                    logError('Failed to process overdue invoice', error, { invoice_id: invoice.id });
                    results.failed++;
                }
            }

            logInfo('Reminder cycle completed', results);

        } catch (error) {
            logError('Reminder cycle execution failed', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Process a single overdue invoice
     */
    async processOverdueInvoice(invoice, results) {
        // Calculate days overdue
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        // Categorize by urgency
        let urgency;
        if (daysOverdue <= 7) {
            urgency = 'low';
        } else if (daysOverdue <= 14) {
            urgency = 'medium';
        } else if (daysOverdue <= 30) {
            urgency = 'high';
        } else {
            urgency = 'critical';
        }

        results.by_urgency[urgency]++;

        // Determine if reminder should be sent based on days overdue
        const shouldSendReminder = this.shouldSendReminder(daysOverdue);

        if (!shouldSendReminder) {
            logInfo('Skipping reminder (not scheduled for today)', {
                invoice_id: invoice.id,
                days_overdue: daysOverdue
            });
            results.skipped++;
            return;
        }

        // Send reminder
        logInfo('Sending payment reminder', {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            days_overdue: daysOverdue,
            urgency
        });

        await mailer.sendReminderEmail(invoice.id);
        results.reminders_sent++;
    }

    /**
     * Determine if reminder should be sent today
     * Reminders are sent on specific days to avoid spam:
     * - Day 1-7: Send on day 3 and 7
     * - Day 8-14: Send on day 10 and 14
     * - Day 15-30: Send every 5 days
     * - Day 30+: Send every 7 days
     */
    shouldSendReminder(daysOverdue) {
        if (daysOverdue <= 0) return false;

        // First week: days 3 and 7
        if (daysOverdue <= 7) {
            return daysOverdue === 3 || daysOverdue === 7;
        }

        // Second week: days 10 and 14
        if (daysOverdue <= 14) {
            return daysOverdue === 10 || daysOverdue === 14;
        }

        // Days 15-30: every 5 days
        if (daysOverdue <= 30) {
            return daysOverdue % 5 === 0;
        }

        // After 30 days: every 7 days
        return daysOverdue % 7 === 0;
    }

    /**
     * Get reminder statistics
     */
    async getReminderStats() {
        try {
            const overdueInvoices = await Invoice.findOverdue();

            const stats = {
                total_overdue: overdueInvoices.length,
                by_urgency: {
                    low: 0,
                    medium: 0,
                    high: 0,
                    critical: 0
                },
                total_overdue_amount: 0
            };

            overdueInvoices.forEach(invoice => {
                const dueDate = new Date(invoice.due_date);
                const today = new Date();
                const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

                if (daysOverdue <= 7) {
                    stats.by_urgency.low++;
                } else if (daysOverdue <= 14) {
                    stats.by_urgency.medium++;
                } else if (daysOverdue <= 30) {
                    stats.by_urgency.high++;
                } else {
                    stats.by_urgency.critical++;
                }

                stats.total_overdue_amount += parseFloat(invoice.total_amount);
            });

            stats.total_overdue_amount = stats.total_overdue_amount.toFixed(2);

            return stats;
        } catch (error) {
            logError('Failed to get reminder stats', error);
            throw error;
        }
    }

    /**
     * Manual trigger for testing
     */
    async triggerManually() {
        logInfo('Manual reminder cycle trigger');
        await this.executeReminderCycle();
    }

    /**
     * Send immediate reminder for specific invoice
     */
    async sendImmediateReminder(invoiceId) {
        try {
            logInfo('Sending immediate reminder', { invoice_id: invoiceId });
            await mailer.sendReminderEmail(invoiceId);
            return { success: true };
        } catch (error) {
            logError('Failed to send immediate reminder', error, { invoice_id: invoiceId });
            throw error;
        }
    }
}

// Export singleton instance
export default new ReminderScheduler();
