import PDFDocument from 'pdfkit';
import { Invoice } from '../../../database/models.js';
import { logInfo, logError } from '../../audit/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Invoice PDF Generator
 * Creates professional PDF invoices with company branding
 */

class InvoiceGenerator {
    /**
     * Generate PDF invoice
     * Returns a buffer that can be uploaded to Cloudinary or sent via email
     */
    async generatePDF(invoiceId) {
        try {
            logInfo('Generating PDF invoice', { invoice_id: invoiceId });

            // Fetch invoice with all details
            const invoice = await Invoice.findById(invoiceId);
            if (!invoice) {
                throw new Error(`Invoice ${invoiceId} not found`);
            }

            // Create PDF document
            const doc = new PDFDocument({ size: 'A4', margin: 50 });

            // Collect PDF data in buffer
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));

            // Build the PDF
            this.addHeader(doc);
            this.addCompanyInfo(doc);
            this.addInvoiceInfo(doc, invoice);
            this.addCustomerInfo(doc, invoice);
            this.addLineItems(doc, invoice);
            this.addTotals(doc, invoice);
            this.addFooter(doc, invoice);

            // Finalize PDF
            doc.end();

            // Return promise that resolves with buffer
            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    logInfo('PDF invoice generated successfully', {
                        invoice_id: invoiceId,
                        size: pdfBuffer.length
                    });
                    resolve(pdfBuffer);
                });
                doc.on('error', reject);
            });
        } catch (error) {
            logError('PDF generation failed', error, { invoice_id: invoiceId });
            throw error;
        }
    }

    /**
     * Add header with company logo and branding
     */
    addHeader(doc) {
        doc
            .fontSize(28)
            .fillColor('#2563eb')
            .text('INVOICE', 50, 50, { align: 'right' })
            .fontSize(10)
            .fillColor('#000000');
    }

    /**
     * Add company information
     */
    addCompanyInfo(doc) {
        const companyName = process.env.COMPANY_NAME || 'BillerAGI Inc.';
        const companyAddress = process.env.COMPANY_ADDRESS || '123 Innovation Drive, Tech City, CA 94000';
        const companyEmail = process.env.COMPANY_EMAIL || 'billing@billeragi.com';
        const companyPhone = process.env.COMPANY_PHONE || '+1-555-BILLING';
        const companyTaxId = process.env.COMPANY_TAX_ID || '12-3456789';

        doc
            .fontSize(16)
            .fillColor('#1e40af')
            .text(companyName, 50, 100)
            .fontSize(10)
            .fillColor('#4b5563')
            .text(companyAddress, 50, 125)
            .text(`Email: ${companyEmail}`, 50, 140)
            .text(`Phone: ${companyPhone}`, 50, 155)
            .text(`Tax ID: ${companyTaxId}`, 50, 170)
            .fillColor('#000000');
    }

    /**
     * Add invoice information
     */
    addInvoiceInfo(doc, invoice) {
        doc
            .fontSize(10)
            .fillColor('#000000')
            .text(`Invoice Number: ${invoice.invoice_number}`, 350, 100, { align: 'right' })
            .text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 350, 115, { align: 'right' })
            .text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 350, 130, { align: 'right' })
            .text(`Status: ${invoice.status.toUpperCase()}`, 350, 145, { align: 'right' });
    }

    /**
     * Add customer billing information
     */
    addCustomerInfo(doc, invoice) {
        doc
            .fontSize(12)
            .fillColor('#1e40af')
            .text('Bill To:', 50, 220)
            .fontSize(10)
            .fillColor('#000000')
            .text(invoice.customer_name, 50, 240)
            .text(invoice.email || invoice.customer_email, 50, 255);

        if (invoice.address) {
            doc.text(invoice.address, 50, 270);
            doc.text(`${invoice.city}, ${invoice.state} ${invoice.zip_code}`, 50, 285);
        }

        if (invoice.tax_id) {
            doc.text(`Tax ID: ${invoice.tax_id}`, 50, 300);
        }
    }

    /**
     * Add line items table
     */
    addLineItems(doc, invoice) {
        const tableTop = 350;

        // Table header
        doc
            .fontSize(11)
            .fillColor('#1e40af')
            .text('Description', 50, tableTop)
            .text('Amount', 450, tableTop, { align: 'right' });

        // Draw header line
        doc
            .strokeColor('#d1d5db')
            .lineWidth(1)
            .moveTo(50, tableTop + 15)
            .lineTo(550, tableTop + 15)
            .stroke();

        // Service line item
        let currentY = tableTop + 30;
        doc
            .fontSize(10)
            .fillColor('#000000')
            .text(invoice.service_description || 'Professional Services', 50, currentY, { width: 350 })
            .text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, 450, currentY, { align: 'right' });

        // Add contract number if available
        if (invoice.contract_number) {
            currentY += 15;
            doc
                .fontSize(9)
                .fillColor('#6b7280')
                .text(`Contract: ${invoice.contract_number}`, 50, currentY);
        }
    }

    /**
     * Add totals section
     */
    addTotals(doc, invoice) {
        const totalsTop = 480;

        // Draw separator line
        doc
            .strokeColor('#d1d5db')
            .lineWidth(1)
            .moveTo(350, totalsTop - 10)
            .lineTo(550, totalsTop - 10)
            .stroke();

        // Subtotal
        doc
            .fontSize(10)
            .fillColor('#000000')
            .text('Subtotal:', 350, totalsTop)
            .text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, 450, totalsTop, { align: 'right' });

        // Tax
        if (invoice.tax_amount > 0) {
            doc
                .text('Tax:', 350, totalsTop + 20)
                .text(`$${parseFloat(invoice.tax_amount).toFixed(2)}`, 450, totalsTop + 20, { align: 'right' });
        }

        // Discount
        if (invoice.discount_amount > 0) {
            doc
                .fillColor('#16a34a')
                .text('Discount:', 350, totalsTop + 40)
                .text(`-$${parseFloat(invoice.discount_amount).toFixed(2)}`, 450, totalsTop + 40, { align: 'right' })
                .fillColor('#000000');
        }

        // Total line
        const totalY = invoice.discount_amount > 0 ? totalsTop + 60 : totalsTop + 40;
        doc
            .strokeColor('#2563eb')
            .lineWidth(2)
            .moveTo(350, totalY + 5)
            .lineTo(550, totalY + 5)
            .stroke();

        // Total amount
        doc
            .fontSize(14)
            .fillColor('#1e40af')
            .text('Total Amount:', 350, totalY + 15)
            .text(`$${parseFloat(invoice.total_amount).toFixed(2)}`, 450, totalY + 15, { align: 'right' })
            .fillColor('#000000');
    }

    /**
     * Add footer with payment instructions
     */
    addFooter(doc, invoice) {
        const footerTop = 650;

        doc
            .fontSize(11)
            .fillColor('#1e40af')
            .text('Payment Instructions', 50, footerTop)
            .fontSize(9)
            .fillColor('#4b5563')
            .text(`Please make payment by ${new Date(invoice.due_date).toLocaleDateString()}`, 50, footerTop + 20)
            .text('Payment methods: Bank transfer, Credit card, Check', 50, footerTop + 35)
            .text(`Reference: ${invoice.invoice_number}`, 50, footerTop + 50);

        // Thank you message
        doc
            .fontSize(10)
            .fillColor('#000000')
            .text('Thank you for your business!', 50, footerTop + 80, { align: 'center' });

        // Page number and generation info
        doc
            .fontSize(8)
            .fillColor('#9ca3af')
            .text(
                `Generated by BillerAGI | Page 1 of 1`,
                50,
                750,
                { align: 'center' }
            );
    }

    /**
     * Generate invoice filename
     */
    generateFilename(invoiceNumber) {
        const timestamp = new Date().toISOString().split('T')[0];
        return `invoice_${invoiceNumber}_${timestamp}.pdf`;
    }
}

// Export singleton instance
export default new InvoiceGenerator();
