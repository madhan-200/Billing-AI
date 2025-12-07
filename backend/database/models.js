import { query } from './connection.js';

// ==================== CUSTOMER MODEL ====================
export const Customer = {
    // Create a new customer
    create: async (customerData) => {
        const { name, email, phone, address, city, state, zip_code, country, tax_id } = customerData;
        const result = await query(
            `INSERT INTO customers (name, email, phone, address, city, state, zip_code, country, tax_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [name, email, phone, address, city, state, zip_code, country || 'USA', tax_id]
        );
        return result.rows[0];
    },

    // Find customer by ID
    findById: async (id) => {
        const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
        return result.rows[0];
    },

    // Find customer by email
    findByEmail: async (email) => {
        const result = await query('SELECT * FROM customers WHERE email = $1', [email]);
        return result.rows[0];
    },

    // Get all customers
    findAll: async () => {
        const result = await query('SELECT * FROM customers WHERE is_active = true ORDER BY created_at DESC');
        return result.rows;
    },

    // Update customer
    update: async (id, customerData) => {
        const { name, email, phone, address, city, state, zip_code, country, tax_id } = customerData;
        const result = await query(
            `UPDATE customers 
       SET name = $1, email = $2, phone = $3, address = $4, city = $5, 
           state = $6, zip_code = $7, country = $8, tax_id = $9
       WHERE id = $10
       RETURNING *`,
            [name, email, phone, address, city, state, zip_code, country, tax_id, id]
        );
        return result.rows[0];
    },

    // Soft delete customer
    delete: async (id) => {
        const result = await query(
            'UPDATE customers SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }
};

// ==================== CONTRACT MODEL ====================
export const Contract = {
    // Create a new contract
    create: async (contractData) => {
        const {
            customer_id, contract_number, service_description, amount,
            billing_frequency, start_date, end_date, tax_rate, discount_percentage, next_billing_date
        } = contractData;

        const result = await query(
            `INSERT INTO contracts 
       (customer_id, contract_number, service_description, amount, billing_frequency, 
        start_date, end_date, tax_rate, discount_percentage, next_billing_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [customer_id, contract_number, service_description, amount, billing_frequency,
                start_date, end_date, tax_rate || 0, discount_percentage || 0, next_billing_date]
        );
        return result.rows[0];
    },

    // Find contract by ID
    findById: async (id) => {
        const result = await query(
            `SELECT c.*, cu.name as customer_name, cu.email as customer_email
       FROM contracts c
       JOIN customers cu ON c.customer_id = cu.id
       WHERE c.id = $1`,
            [id]
        );
        return result.rows[0];
    },

    // Get contracts due for billing
    findDueForBilling: async () => {
        const result = await query(
            `SELECT c.*, cu.name as customer_name, cu.email as customer_email, cu.address, 
              cu.city, cu.state, cu.zip_code, cu.tax_id
       FROM contracts c
       JOIN customers cu ON c.customer_id = cu.id
       WHERE c.is_active = true 
         AND c.next_billing_date <= CURRENT_DATE
       ORDER BY c.next_billing_date ASC`
        );
        return result.rows;
    },

    // Update next billing date
    updateNextBillingDate: async (id, nextDate) => {
        const result = await query(
            'UPDATE contracts SET next_billing_date = $1 WHERE id = $2 RETURNING *',
            [nextDate, id]
        );
        return result.rows[0];
    },

    // Get all contracts for a customer
    findByCustomerId: async (customerId) => {
        const result = await query(
            'SELECT * FROM contracts WHERE customer_id = $1 AND is_active = true ORDER BY created_at DESC',
            [customerId]
        );
        return result.rows;
    }
};

// ==================== INVOICE MODEL ====================
export const Invoice = {
    // Create a new invoice
    create: async (invoiceData) => {
        const {
            invoice_number, customer_id, contract_id, issue_date, due_date,
            subtotal, tax_amount, discount_amount, total_amount, status
        } = invoiceData;

        const result = await query(
            `INSERT INTO invoices 
       (invoice_number, customer_id, contract_id, issue_date, due_date, 
        subtotal, tax_amount, discount_amount, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [invoice_number, customer_id, contract_id, issue_date, due_date,
                subtotal, tax_amount, discount_amount, total_amount, status || 'pending']
        );
        return result.rows[0];
    },

    // Find invoice by ID with customer details
    findById: async (id) => {
        const result = await query(
            `SELECT i.*, 
              c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
              c.address, c.city, c.state, c.zip_code, c.tax_id,
              ct.service_description, ct.contract_number
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       JOIN contracts ct ON i.contract_id = ct.id
       WHERE i.id = $1`,
            [id]
        );
        return result.rows[0];
    },

    // Get all invoices with pagination
    findAll: async (limit = 100, offset = 0) => {
        const result = await query(
            `SELECT i.*, c.name as customer_name, c.email as customer_email
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       ORDER BY i.created_at DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    },

    // Update invoice status
    updateStatus: async (id, status) => {
        const result = await query(
            'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    },

    // Update PDF URL and Cloudinary ID
    updatePdfInfo: async (id, pdfUrl, cloudinaryPublicId) => {
        const result = await query(
            'UPDATE invoices SET pdf_url = $1, cloudinary_public_id = $2 WHERE id = $3 RETURNING *',
            [pdfUrl, cloudinaryPublicId, id]
        );
        return result.rows[0];
    },

    // Update AI validation info
    updateAiValidation: async (id, validationStatus, anomalyScore) => {
        const result = await query(
            'UPDATE invoices SET ai_validation_status = $1, ai_anomaly_score = $2 WHERE id = $3 RETURNING *',
            [validationStatus, anomalyScore, id]
        );
        return result.rows[0];
    },

    // Get overdue invoices
    findOverdue: async () => {
        const result = await query(
            `SELECT i.*, c.name as customer_name, c.email as customer_email
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       WHERE i.status IN ('sent', 'pending') 
         AND i.due_date < CURRENT_DATE
       ORDER BY i.due_date ASC`
        );
        return result.rows;
    },

    // Get invoices by status
    findByStatus: async (status) => {
        const result = await query(
            `SELECT i.*, c.name as customer_name, c.email as customer_email
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       WHERE i.status = $1
       ORDER BY i.created_at DESC`,
            [status]
        );
        return result.rows;
    }
};

// ==================== PAYMENT MODEL ====================
export const Payment = {
    // Record a payment
    create: async (paymentData) => {
        const { invoice_id, payment_date, amount, payment_method, transaction_id, notes } = paymentData;
        const result = await query(
            `INSERT INTO payments (invoice_id, payment_date, amount, payment_method, transaction_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [invoice_id, payment_date, amount, payment_method, transaction_id, notes]
        );
        return result.rows[0];
    },

    // Get payments for an invoice
    findByInvoiceId: async (invoiceId) => {
        const result = await query(
            'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
            [invoiceId]
        );
        return result.rows;
    },

    // Get all payments
    findAll: async () => {
        const result = await query(
            `SELECT p.*, i.invoice_number, c.name as customer_name
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       JOIN customers c ON i.customer_id = c.id
       ORDER BY p.payment_date DESC`
        );
        return result.rows;
    }
};

// ==================== AUDIT LOG MODEL ====================
export const AuditLog = {
    // Create audit log entry
    create: async (logData) => {
        const { action_type, entity_type, entity_id, user_type, user_id, description, metadata, ip_address } = logData;
        const result = await query(
            `INSERT INTO audit_logs 
       (action_type, entity_type, entity_id, user_type, user_id, description, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [action_type, entity_type, entity_id, user_type || 'system', user_id, description,
                metadata ? JSON.stringify(metadata) : null, ip_address]
        );
        return result.rows[0];
    },

    // Get audit logs with filters
    findAll: async (filters = {}, limit = 100) => {
        let queryText = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (filters.entity_type) {
            queryText += ` AND entity_type = $${paramCount}`;
            params.push(filters.entity_type);
            paramCount++;
        }

        if (filters.action_type) {
            queryText += ` AND action_type = $${paramCount}`;
            params.push(filters.action_type);
            paramCount++;
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
        params.push(limit);

        const result = await query(queryText, params);
        return result.rows;
    }
};

// ==================== AI VALIDATION LOG MODEL ====================
export const AIValidationLog = {
    // Create validation log
    create: async (logData) => {
        const { invoice_id, anomaly_score, validation_status, flags, suggestions, ai_response } = logData;
        const result = await query(
            `INSERT INTO ai_validation_logs 
       (invoice_id, anomaly_score, validation_status, flags, suggestions, ai_response)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [invoice_id, anomaly_score, validation_status,
                flags ? JSON.stringify(flags) : null, suggestions, ai_response]
        );
        return result.rows[0];
    },

    // Get validation logs for an invoice
    findByInvoiceId: async (invoiceId) => {
        const result = await query(
            'SELECT * FROM ai_validation_logs WHERE invoice_id = $1 ORDER BY validation_date DESC',
            [invoiceId]
        );
        return result.rows;
    },

    // Get all flagged validations
    findFlagged: async () => {
        const result = await query(
            `SELECT v.*, i.invoice_number, c.name as customer_name
       FROM ai_validation_logs v
       JOIN invoices i ON v.invoice_id = i.id
       JOIN customers c ON i.customer_id = c.id
       WHERE v.validation_status = 'flagged'
       ORDER BY v.validation_date DESC`
        );
        return result.rows;
    }
};

// ==================== CLIENT QUERY MODEL ====================
export const ClientQuery = {
    // Create a client query
    create: async (queryData) => {
        const { customer_id, invoice_id, query_text, query_type, ai_response, escalated } = queryData;
        const result = await query(
            `INSERT INTO client_queries 
       (customer_id, invoice_id, query_text, query_type, ai_response, escalated)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [customer_id, invoice_id, query_text, query_type || 'general', ai_response, escalated || false]
        );
        return result.rows[0];
    },

    // Mark query as resolved
    resolve: async (id) => {
        const result = await query(
            'UPDATE client_queries SET resolved = true, resolved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    },

    // Get unresolved queries
    findUnresolved: async () => {
        const result = await query(
            `SELECT q.*, c.name as customer_name, c.email as customer_email
       FROM client_queries q
       JOIN customers c ON q.customer_id = c.id
       WHERE q.resolved = false
       ORDER BY q.created_at DESC`
        );
        return result.rows;
    }
};

// ==================== ADMIN USER MODEL ====================
export const AdminUser = {
    // Create admin user
    create: async (userData) => {
        const { username, email, password_hash, full_name, role } = userData;
        const result = await query(
            `INSERT INTO admin_users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role, created_at`,
            [username, email, password_hash, full_name, role || 'admin']
        );
        return result.rows[0];
    },

    // Find by username
    findByUsername: async (username) => {
        const result = await query(
            'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
            [username]
        );
        return result.rows[0];
    },

    // Find by email
    findByEmail: async (email) => {
        const result = await query(
            'SELECT * FROM admin_users WHERE email = $1 AND is_active = true',
            [email]
        );
        return result.rows[0];
    },

    // Update last login
    updateLastLogin: async (id) => {
        await query(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );
    }
};

export default {
    Customer,
    Contract,
    Invoice,
    Payment,
    AuditLog,
    AIValidationLog,
    ClientQuery,
    AdminUser
};
