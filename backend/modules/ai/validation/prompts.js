/**
 * AI Validation Prompts for Gemini API
 * Structured prompts for invoice validation tasks
 */

export const VALIDATION_SYSTEM_PROMPT = `You are an expert billing analyst AI assistant specializing in invoice validation and fraud detection. Your role is to:

1. Verify invoice amounts against contract terms
2. Detect duplicate invoices or missing line items
3. Validate tax calculations and discount applications
4. Flag anomalies and suspicious patterns
5. Provide clear, actionable suggestions for corrections

Always respond in valid JSON format with the following structure:
{
  "validation_status": "validated" | "flagged" | "failed",
  "anomaly_score": 0-100,
  "flags": [],
  "suggestions": "",
  "confidence": 0-100
}`;

export const buildValidationPrompt = (invoiceData, contractData) => {
    return `Validate the following invoice against the contract terms:

**INVOICE DETAILS:**
- Invoice Number: ${invoiceData.invoice_number}
- Customer: ${invoiceData.customer_name}
- Issue Date: ${invoiceData.issue_date}
- Due Date: ${invoiceData.due_date}
- Subtotal: $${invoiceData.subtotal}
- Tax Amount: $${invoiceData.tax_amount} (${contractData.tax_rate}% expected)
- Discount Amount: $${invoiceData.discount_amount} (${contractData.discount_percentage}% expected)
- Total Amount: $${invoiceData.total_amount}

**CONTRACT TERMS:**
- Contract Number: ${contractData.contract_number}
- Service Description: ${contractData.service_description}
- Contract Amount: $${contractData.amount}
- Billing Frequency: ${contractData.billing_frequency}
- Tax Rate: ${contractData.tax_rate}%
- Discount Percentage: ${contractData.discount_percentage}%

**VALIDATION TASKS:**
1. Verify that the subtotal matches the contract amount
2. Verify tax calculation: subtotal × ${contractData.tax_rate}% = $${invoiceData.tax_amount}
3. Verify discount calculation: subtotal × ${contractData.discount_percentage}% = $${invoiceData.discount_amount}
4. Verify total: subtotal + tax - discount = $${invoiceData.total_amount}
5. Check for any unusual patterns or anomalies
6. Verify the billing frequency is appropriate

**RESPONSE FORMAT (JSON only):**
{
  "validation_status": "validated" | "flagged" | "failed",
  "anomaly_score": 0-100 (0 = perfect, 100 = highly suspicious),
  "flags": ["list of specific issues found"],
  "suggestions": "Clear recommendations for corrections or next steps",
  "confidence": 0-100 (your confidence in this validation)
}

Respond ONLY with valid JSON. No additional text.`;
};

export const buildDuplicateCheckPrompt = (invoiceData, recentInvoices) => {
    return `Check if this invoice is a duplicate or has suspicious similarities to recent invoices:

**CURRENT INVOICE:**
- Invoice Number: ${invoiceData.invoice_number}
- Customer: ${invoiceData.customer_name}
- Amount: $${invoiceData.total_amount}
- Issue Date: ${invoiceData.issue_date}

**RECENT INVOICES (Last 30 days):**
${recentInvoices.map(inv => `- ${inv.invoice_number}: ${inv.customer_name}, $${inv.total_amount}, ${inv.issue_date}`).join('\n')}

**ANALYSIS REQUIRED:**
1. Check for duplicate invoice numbers
2. Check for duplicate amounts to the same customer within a short timeframe
3. Identify any suspicious patterns

**RESPONSE FORMAT (JSON only):**
{
  "is_duplicate": true | false,
  "duplicate_of": "invoice_number or null",
  "similarity_score": 0-100,
  "explanation": "Brief explanation of findings"
}

Respond ONLY with valid JSON.`;
};

export const buildAnomalyDetectionPrompt = (invoiceData, customerHistory) => {
    return `Analyze this invoice for anomalies based on customer's billing history:

**CURRENT INVOICE:**
- Amount: $${invoiceData.total_amount}
- Issue Date: ${invoiceData.issue_date}

**CUSTOMER BILLING HISTORY:**
- Average Invoice Amount: $${customerHistory.avg_amount}
- Typical Billing Frequency: ${customerHistory.frequency}
- Last Invoice Date: ${customerHistory.last_invoice_date}
- Total Invoices: ${customerHistory.total_invoices}

**ANALYSIS REQUIRED:**
1. Is the amount significantly different from historical average?
2. Is the billing timing unusual?
3. Are there any red flags?

**RESPONSE FORMAT (JSON only):**
{
  "has_anomaly": true | false,
  "anomaly_type": "amount" | "timing" | "pattern" | "none",
  "severity": "low" | "medium" | "high",
  "explanation": "Brief explanation"
}

Respond ONLY with valid JSON.`;
};
