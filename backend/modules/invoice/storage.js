import { v2 as cloudinary } from 'cloudinary';
import { Invoice } from '../../../database/models.js';
import { logInfo, logError } from '../../audit/logger.js';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Invoice Storage Manager
 * Handles uploading and managing invoice PDFs in Cloudinary
 */

class InvoiceStorage {
    /**
     * Upload PDF buffer to Cloudinary
     */
    async uploadPDF(pdfBuffer, invoiceNumber) {
        try {
            logInfo('Uploading PDF to Cloudinary', { invoice_number: invoiceNumber });

            // Convert buffer to base64
            const base64PDF = pdfBuffer.toString('base64');
            const dataURI = `data:application/pdf;base64,${base64PDF}`;

            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'billeragi/invoices',
                public_id: `invoice_${invoiceNumber}_${Date.now()}`,
                resource_type: 'raw',
                format: 'pdf',
                tags: ['invoice', invoiceNumber]
            });

            logInfo('PDF uploaded successfully', {
                invoice_number: invoiceNumber,
                public_id: result.public_id,
                url: result.secure_url
            });

            return {
                url: result.secure_url,
                public_id: result.public_id,
                bytes: result.bytes
            };
        } catch (error) {
            logError('PDF upload failed', error, { invoice_number: invoiceNumber });
            throw error;
        }
    }

    /**
     * Generate signed URL for secure PDF download
     */
    async getSignedURL(publicId, expiresIn = 3600) {
        try {
            const signedUrl = cloudinary.url(publicId, {
                resource_type: 'raw',
                sign_url: true,
                secure: true,
                expires_at: Math.floor(Date.now() / 1000) + expiresIn
            });

            return signedUrl;
        } catch (error) {
            logError('Failed to generate signed URL', error, { public_id: publicId });
            throw error;
        }
    }

    /**
     * Delete PDF from Cloudinary
     */
    async deletePDF(publicId) {
        try {
            logInfo('Deleting PDF from Cloudinary', { public_id: publicId });

            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: 'raw'
            });

            logInfo('PDF deleted successfully', { public_id: publicId, result });

            return result;
        } catch (error) {
            logError('PDF deletion failed', error, { public_id: publicId });
            throw error;
        }
    }

    /**
     * Upload and update invoice record
     */
    async uploadAndUpdateInvoice(invoiceId, pdfBuffer, invoiceNumber) {
        try {
            // Upload to Cloudinary
            const uploadResult = await this.uploadPDF(pdfBuffer, invoiceNumber);

            // Update invoice record with PDF info
            await Invoice.updatePdfInfo(
                invoiceId,
                uploadResult.url,
                uploadResult.public_id
            );

            logInfo('Invoice PDF info updated', {
                invoice_id: invoiceId,
                pdf_url: uploadResult.url
            });

            return uploadResult;
        } catch (error) {
            logError('Failed to upload and update invoice', error, { invoice_id: invoiceId });
            throw error;
        }
    }

    /**
     * Get all invoices from Cloudinary folder
     */
    async listInvoices() {
        try {
            const result = await cloudinary.api.resources({
                type: 'upload',
                resource_type: 'raw',
                prefix: 'billeragi/invoices',
                max_results: 500
            });

            return result.resources;
        } catch (error) {
            logError('Failed to list invoices', error);
            throw error;
        }
    }

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        try {
            const resources = await this.listInvoices();

            const totalSize = resources.reduce((sum, resource) => sum + resource.bytes, 0);
            const totalCount = resources.length;

            return {
                total_invoices: totalCount,
                total_size_bytes: totalSize,
                total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
                average_size_kb: totalCount > 0 ? ((totalSize / totalCount) / 1024).toFixed(2) : 0
            };
        } catch (error) {
            logError('Failed to get storage stats', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new InvoiceStorage();
