import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { Invoice, Contract, AIValidationLog } from '../../../database/models.js';
import { buildValidationPrompt, buildDuplicateCheckPrompt, VALIDATION_SYSTEM_PROMPT } from './prompts.js';
import { aiLogger } from '../../audit/logger.js';
import auditManager from '../../audit/audit-manager.js';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * AI Validation Engine
 * Uses Gemini API to validate invoices before sending to customers
 */

class AIValidator {
    /**
     * Validate a complete invoice
     */
    async validateInvoice(invoiceId) {
        try {
            aiLogger.info('Starting invoice validation', { invoice_id: invoiceId });

            // Fetch invoice with customer and contract details
            const invoice = await Invoice.findById(invoiceId);
            if (!invoice) {
                throw new Error(`Invoice ${invoiceId} not found`);
            }

            // Fetch contract details
            const contract = await Contract.findById(invoice.contract_id);
            if (!contract) {
                throw new Error(`Contract ${invoice.contract_id} not found`);
            }

            // Run validation checks
            const validationResult = await this.performValidation(invoice, contract);
            const duplicateCheck = await this.checkDuplicates(invoice);

            // Combine results
            const finalResult = this.combineResults(validationResult, duplicateCheck);

            // Save validation log
            await AIValidationLog.create({
                invoice_id: invoiceId,
                anomaly_score: finalResult.anomaly_score,
                validation_status: finalResult.validation_status,
                flags: finalResult.flags,
                suggestions: finalResult.suggestions,
                ai_response: JSON.stringify(finalResult)
            });

            // Update invoice with AI validation status
            await Invoice.updateAiValidation(
                invoiceId,
                finalResult.validation_status,
                finalResult.anomaly_score
            );

            // Log to audit trail
            await auditManager.logAIValidation(invoiceId, finalResult);

            aiLogger.info('Invoice validation completed', {
                invoice_id: invoiceId,
                status: finalResult.validation_status,
                anomaly_score: finalResult.anomaly_score
            });

            return finalResult;
        } catch (error) {
            aiLogger.error('Invoice validation failed', {
                invoice_id: invoiceId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Perform main validation using Gemini API
     */
    async performValidation(invoice, contract) {
        try {
            const prompt = buildValidationPrompt(invoice, contract);

            const result = await model.generateContent([
                VALIDATION_SYSTEM_PROMPT,
                prompt
            ]);

            const response = result.response;
            const text = response.text();

            // Parse JSON response
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const validationData = JSON.parse(cleanedText);

            aiLogger.info('AI validation response received', {
                invoice_id: invoice.id,
                validation_status: validationData.validation_status
            });

            return validationData;
        } catch (error) {
            aiLogger.error('AI validation API call failed', {
                invoice_id: invoice.id,
                error: error.message
            });

            // Return a safe fallback
            return {
                validation_status: 'failed',
                anomaly_score: 100,
                flags: ['AI validation failed - manual review required'],
                suggestions: 'Please manually review this invoice due to AI validation error.',
                confidence: 0
            };
        }
    }

    /**
     * Check for duplicate invoices
     */
    async checkDuplicates(invoice) {
        try {
            // Get recent invoices for the same customer (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const allInvoices = await Invoice.findAll(1000, 0);
            const recentInvoices = allInvoices.filter(inv =>
                inv.customer_id === invoice.customer_id &&
                inv.id !== invoice.id &&
                new Date(inv.created_at) >= thirtyDaysAgo
            );

            if (recentInvoices.length === 0) {
                return {
                    is_duplicate: false,
                    duplicate_of: null,
                    similarity_score: 0,
                    explanation: 'No recent invoices found for comparison'
                };
            }

            const prompt = buildDuplicateCheckPrompt(invoice, recentInvoices);

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const duplicateData = JSON.parse(cleanedText);

            return duplicateData;
        } catch (error) {
            aiLogger.error('Duplicate check failed', {
                invoice_id: invoice.id,
                error: error.message
            });

            return {
                is_duplicate: false,
                duplicate_of: null,
                similarity_score: 0,
                explanation: 'Duplicate check failed - proceeding with caution'
            };
        }
    }

    /**
     * Combine validation and duplicate check results
     */
    combineResults(validationResult, duplicateCheck) {
        let finalStatus = validationResult.validation_status;
        let finalScore = validationResult.anomaly_score;
        let finalFlags = [...(validationResult.flags || [])];
        let finalSuggestions = validationResult.suggestions || '';

        // Add duplicate check results
        if (duplicateCheck.is_duplicate) {
            finalStatus = 'flagged';
            finalScore = Math.max(finalScore, 90);
            finalFlags.push(`Possible duplicate of invoice ${duplicateCheck.duplicate_of}`);
            finalSuggestions += ` DUPLICATE ALERT: This invoice appears to be a duplicate. ${duplicateCheck.explanation}`;
        } else if (duplicateCheck.similarity_score > 70) {
            finalFlags.push(`High similarity (${duplicateCheck.similarity_score}%) to recent invoices`);
            finalScore = Math.max(finalScore, 60);
        }

        // Determine final status based on score
        if (finalScore >= 70) {
            finalStatus = 'flagged';
        } else if (finalScore >= 40) {
            finalStatus = 'validated'; // But with warnings
        } else {
            finalStatus = 'validated';
        }

        return {
            validation_status: finalStatus,
            anomaly_score: finalScore,
            flags: finalFlags,
            suggestions: finalSuggestions,
            confidence: validationResult.confidence || 80,
            duplicate_check: duplicateCheck
        };
    }

    /**
     * Batch validate multiple invoices
     */
    async batchValidate(invoiceIds) {
        const results = [];

        for (const invoiceId of invoiceIds) {
            try {
                const result = await this.validateInvoice(invoiceId);
                results.push({ invoice_id: invoiceId, success: true, result });
            } catch (error) {
                results.push({ invoice_id: invoiceId, success: false, error: error.message });
            }
        }

        return results;
    }

    /**
     * Get validation summary statistics
     */
    async getValidationStats() {
        try {
            const allInvoices = await Invoice.findAll(1000, 0);

            const stats = {
                total_validated: allInvoices.filter(i => i.ai_validation_status === 'validated').length,
                total_flagged: allInvoices.filter(i => i.ai_validation_status === 'flagged').length,
                total_failed: allInvoices.filter(i => i.ai_validation_status === 'failed').length,
                total_pending: allInvoices.filter(i => i.ai_validation_status === 'pending').length,
                average_anomaly_score: allInvoices.reduce((sum, i) => sum + (i.ai_anomaly_score || 0), 0) / allInvoices.length
            };

            return stats;
        } catch (error) {
            aiLogger.error('Failed to get validation stats', { error: error.message });
            throw error;
        }
    }
}

// Export singleton instance
export default new AIValidator();
