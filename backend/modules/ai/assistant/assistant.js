import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { Invoice, Customer, ClientQuery } from '../../../database/models.js';
import {
    buildQueryResponsePrompt,
    buildEscalationCheckPrompt,
    buildConversationContextPrompt,
    ASSISTANT_SYSTEM_PROMPT
} from './prompts.js';
import { aiLogger } from '../../audit/logger.js';
import auditManager from '../../audit/audit-manager.js';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Client AI Billing Assistant
 * Handles customer queries about invoices automatically
 */

class ClientAssistant {
    /**
     * Handle a customer query
     */
    async handleQuery(customerId, queryText, invoiceId = null) {
        try {
            aiLogger.info('Processing client query', {
                customer_id: customerId,
                invoice_id: invoiceId
            });

            // Fetch customer data
            const customer = await Customer.findById(customerId);
            if (!customer) {
                throw new Error(`Customer ${customerId} not found`);
            }

            // Fetch invoice data if provided
            let invoice = null;
            if (invoiceId) {
                invoice = await Invoice.findById(invoiceId);
            }

            // Check if query needs escalation
            const escalationCheck = await this.checkEscalation(queryText);

            let response;
            let needsEscalation = escalationCheck.should_escalate;

            if (needsEscalation) {
                // Escalate immediately
                response = {
                    response: "Thank you for your inquiry. This matter requires attention from our finance team. A specialist will contact you within 24 hours to address your concern.",
                    needs_escalation: true,
                    escalation_reason: escalationCheck.reason,
                    query_type: 'escalated',
                    confidence: 100
                };
            } else {
                // Generate AI response
                response = await this.generateResponse(queryText, invoice, customer);
                needsEscalation = response.needs_escalation;
            }

            // Save query to database
            const queryRecord = await ClientQuery.create({
                customer_id: customerId,
                invoice_id: invoiceId,
                query_text: queryText,
                query_type: response.query_type || 'general',
                ai_response: response.response,
                escalated: needsEscalation
            });

            // Log to audit trail
            await auditManager.logClientQuery(
                queryRecord.id,
                customerId,
                response.query_type || 'general',
                !needsEscalation,
                {
                    invoice_id: invoiceId,
                    escalation_reason: response.escalation_reason
                }
            );

            aiLogger.info('Client query processed', {
                query_id: queryRecord.id,
                escalated: needsEscalation,
                confidence: response.confidence
            });

            return {
                query_id: queryRecord.id,
                response: response.response,
                escalated: needsEscalation,
                escalation_reason: response.escalation_reason,
                query_type: response.query_type,
                confidence: response.confidence
            };
        } catch (error) {
            aiLogger.error('Client query processing failed', {
                customer_id: customerId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Generate AI response to query
     */
    async generateResponse(queryText, invoice, customer) {
        try {
            const prompt = buildQueryResponsePrompt(queryText, invoice, customer);

            const result = await model.generateContent([
                ASSISTANT_SYSTEM_PROMPT,
                prompt
            ]);

            const text = result.response.text();
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const responseData = JSON.parse(cleanedText);

            return responseData;
        } catch (error) {
            aiLogger.error('AI response generation failed', {
                error: error.message
            });

            // Fallback response
            return {
                response: "I apologize, but I'm having trouble processing your request right now. A member of our billing team will contact you shortly to assist you.",
                needs_escalation: true,
                escalation_reason: 'AI processing error',
                query_type: 'general',
                confidence: 0
            };
        }
    }

    /**
     * Check if query needs escalation
     */
    async checkEscalation(queryText) {
        try {
            const prompt = buildEscalationCheckPrompt(queryText);

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const escalationData = JSON.parse(cleanedText);

            return escalationData;
        } catch (error) {
            aiLogger.error('Escalation check failed', { error: error.message });

            // Default to escalation on error
            return {
                should_escalate: true,
                reason: 'Unable to process query automatically',
                urgency: 'medium',
                suggested_department: 'customer_service'
            };
        }
    }

    /**
     * Handle query with conversation context
     */
    async handleConversationalQuery(customerId, queryText, invoiceId = null) {
        try {
            // Get previous queries from this customer
            const allQueries = await ClientQuery.findUnresolved();
            const customerQueries = allQueries
                .filter(q => q.customer_id === customerId)
                .slice(0, 5); // Last 5 queries

            if (customerQueries.length === 0) {
                // No history, handle as new query
                return this.handleQuery(customerId, queryText, invoiceId);
            }

            // Generate contextual response
            const prompt = buildConversationContextPrompt(queryText, customerQueries);
            const result = await model.generateContent([ASSISTANT_SYSTEM_PROMPT, prompt]);
            const text = result.response.text();
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const contextualResponse = JSON.parse(cleanedText);

            // Save query
            const queryRecord = await ClientQuery.create({
                customer_id: customerId,
                invoice_id: invoiceId,
                query_text: queryText,
                query_type: 'conversational',
                ai_response: contextualResponse.response,
                escalated: false
            });

            return {
                query_id: queryRecord.id,
                response: contextualResponse.response,
                escalated: false,
                conversation_complete: contextualResponse.conversation_complete
            };
        } catch (error) {
            aiLogger.error('Conversational query failed', { error: error.message });
            // Fallback to regular query handling
            return this.handleQuery(customerId, queryText, invoiceId);
        }
    }

    /**
     * Get query statistics
     */
    async getQueryStats() {
        try {
            const allQueries = await ClientQuery.findUnresolved();
            const resolvedQueries = allQueries.filter(q => q.resolved);
            const escalatedQueries = allQueries.filter(q => q.escalated);

            const totalQueries = allQueries.length + resolvedQueries.length;
            const aiHandledCount = totalQueries - escalatedQueries.length;

            return {
                total_queries: totalQueries,
                ai_handled: aiHandledCount,
                ai_handled_percentage: totalQueries > 0 ? (aiHandledCount / totalQueries * 100).toFixed(2) : 0,
                escalated: escalatedQueries.length,
                escalation_rate: totalQueries > 0 ? (escalatedQueries.length / totalQueries * 100).toFixed(2) : 0,
                unresolved: allQueries.length,
                resolved: resolvedQueries.length
            };
        } catch (error) {
            aiLogger.error('Failed to get query stats', { error: error.message });
            throw error;
        }
    }

    /**
     * Get common query types
     */
    async getCommonQueryTypes() {
        try {
            const allQueries = await ClientQuery.findUnresolved();

            const typeCounts = allQueries.reduce((acc, query) => {
                acc[query.query_type] = (acc[query.query_type] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(typeCounts)
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count);
        } catch (error) {
            aiLogger.error('Failed to get common query types', { error: error.message });
            throw error;
        }
    }

    /**
     * Mark query as resolved
     */
    async resolveQuery(queryId) {
        try {
            await ClientQuery.resolve(queryId);
            aiLogger.info('Query marked as resolved', { query_id: queryId });
        } catch (error) {
            aiLogger.error('Failed to resolve query', { query_id: queryId, error: error.message });
            throw error;
        }
    }
}

// Export singleton instance
export default new ClientAssistant();
