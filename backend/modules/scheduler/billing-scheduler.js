import cron from 'node-cron';
import { Contract, Invoice } from '../../../database/models.js';
import invoiceGenerator from '../invoice/generator.js';
import invoiceStorage from '../invoice/storage.js';
import aiValidator from '../ai/validation/validator.js';
import mailer from '../email/mailer.js';
import auditManager from '../audit/audit-manager.js';
import { logInfo, logError } from '../audit/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Billing Scheduler
 * Automated daily billing execution
 */

class BillingScheduler {
    constructor() {
        this.isRunning = false;
        this.cronSchedule = process.env.BILLING_CRON_SCHEDULE || '0 9 * * *'; // Default: 9 AM daily
    }

    /**
     * Start the billing scheduler
     */
    start() {
        logInfo('Starting billing scheduler', { schedule: this.cronSchedule });

        // Schedule daily billing job
        cron.schedule(this.cronSchedule, async () => {
            await this.executeBillingCycle();
        });

        logInfo('Billing scheduler started successfully');
    }

    /**
     * Execute complete billing cycle
     */
    async executeBillingCycle() {
        if (this.isRunning) {
            logInfo('Billing cycle already running, skipping...');
            return;
        }

        this.isRunning = true;
        logInfo('Starting billing cycle execution');

        try {
            // Step 1: Find contracts due for billing
            const dueContracts = await Contract.findDueForBilling();
            logInfo(`Found ${dueContracts.length} contracts due for billing`);

            if (dueContracts.length === 0) {
                logInfo('No contracts due for billing today');
                this.isRunning = false;
                return;
            }

            const results = {
                total: dueContracts.length,
                successful: 0,
                failed: 0,
                flagged: 0,
                errors: []
            };

            // Step 2: Process each contract
            for (const contract of dueContracts) {
                try {
                    await this.processContract(contract, results);
                } catch (error) {
                    logError('Failed to process contract', error, { contract_id: contract.id });
                    results.failed++;
                    results.errors.push({
                        contract_id: contract.id,
                        error: error.message
                    });
                }
            }

            // Log summary
            logInfo('Billing cycle completed', results);

            // Log to audit trail
            await auditManager.logAction({
                action_type: 'BILLING_CYCLE_COMPLETED',
                entity_type: 'system',
                description: `Billing cycle completed: ${results.successful} successful, ${results.failed} failed, ${results.flagged} flagged`,
                metadata: results
            });

        } catch (error) {
            logError('Billing cycle execution failed', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Process a single contract
     */
    async processContract(contract, results) {
        logInfo('Processing contract', { contract_id: contract.id, customer: contract.customer_name });

        // Step 1: Calculate invoice amounts
        const invoiceData = this.calculateInvoiceAmounts(contract);

        // Step 2: Create invoice record
        const invoice = await Invoice.create(invoiceData);
        logInfo('Invoice created', { invoice_id: invoice.id, invoice_number: invoice.invoice_number });

        // Log invoice generation
        await auditManager.logInvoiceGeneration(
            invoice.id,
            contract.customer_id,
            contract.id,
            { invoice_number: invoice.invoice_number }
        );

        // Step 3: Generate PDF
        const pdfBuffer = await invoiceGenerator.generatePDF(invoice.id);
        logInfo('PDF generated', { invoice_id: invoice.id });

        // Step 4: Upload to Cloudinary
        await invoiceStorage.uploadAndUpdateInvoice(
            invoice.id,
            pdfBuffer,
            invoice.invoice_number
        );
        logInfo('PDF uploaded to Cloudinary', { invoice_id: invoice.id });

        // Step 5: AI Validation
        const validationResult = await aiValidator.validateInvoice(invoice.id);
        logInfo('AI validation completed', {
            invoice_id: invoice.id,
            status: validationResult.validation_status,
            anomaly_score: validationResult.anomaly_score
        });

        // Step 6: Send email if validated
        if (validationResult.validation_status === 'validated') {
            await mailer.sendInvoiceEmail(invoice.id);
            logInfo('Invoice email sent', { invoice_id: invoice.id });
            results.successful++;
        } else {
            logInfo('Invoice flagged for review', {
                invoice_id: invoice.id,
                flags: validationResult.flags
            });
            results.flagged++;
        }

        // Step 7: Update next billing date
        const nextBillingDate = this.calculateNextBillingDate(
            contract.next_billing_date,
            contract.billing_frequency
        );
        await Contract.updateNextBillingDate(contract.id, nextBillingDate);
        logInfo('Next billing date updated', {
            contract_id: contract.id,
            next_date: nextBillingDate
        });
    }

    /**
     * Calculate invoice amounts based on contract
     */
    calculateInvoiceAmounts(contract) {
        const subtotal = parseFloat(contract.amount);
        const taxRate = parseFloat(contract.tax_rate || 0);
        const discountPercentage = parseFloat(contract.discount_percentage || 0);

        const taxAmount = (subtotal * taxRate) / 100;
        const discountAmount = (subtotal * discountPercentage) / 100;
        const totalAmount = subtotal + taxAmount - discountAmount;

        // Generate invoice number
        const invoiceNumber = this.generateInvoiceNumber();

        // Calculate due date (30 days from issue date)
        const issueDate = new Date();
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 30);

        return {
            invoice_number: invoiceNumber,
            customer_id: contract.customer_id,
            contract_id: contract.id,
            issue_date: issueDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            subtotal: subtotal.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            discount_amount: discountAmount.toFixed(2),
            total_amount: totalAmount.toFixed(2),
            status: 'pending'
        };
    }

    /**
     * Calculate next billing date based on frequency
     */
    calculateNextBillingDate(currentDate, frequency) {
        const date = new Date(currentDate);

        switch (frequency) {
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'quarterly':
                date.setMonth(date.getMonth() + 3);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
            case 'one-time':
                return null; // No next billing for one-time contracts
            default:
                date.setMonth(date.getMonth() + 1);
        }

        return date.toISOString().split('T')[0];
    }

    /**
     * Generate unique invoice number
     */
    generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        return `INV-${year}${month}${day}-${random}`;
    }

    /**
     * Manual trigger for testing
     */
    async triggerManually() {
        logInfo('Manual billing cycle trigger');
        await this.executeBillingCycle();
    }
}

// Export singleton instance
export default new BillingScheduler();
