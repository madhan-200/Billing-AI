-- BillerAGI Database Schema
-- PostgreSQL Schema for Billing Automation Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    tax_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Contracts Table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    service_description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    billing_frequency VARCHAR(20) NOT NULL CHECK (billing_frequency IN ('monthly', 'quarterly', 'yearly', 'one-time')),
    start_date DATE NOT NULL,
    end_date DATE,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    next_billing_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'sent', 'paid', 'overdue', 'cancelled')),
    pdf_url TEXT,
    cloudinary_public_id VARCHAR(255),
    ai_validation_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_validation_status IN ('pending', 'validated', 'flagged', 'failed')),
    ai_anomaly_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Validation Logs Table
CREATE TABLE ai_validation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    validation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    anomaly_score INTEGER NOT NULL,
    validation_status VARCHAR(20) NOT NULL,
    flags JSONB,
    suggestions TEXT,
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Queries Table
CREATE TABLE client_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    query_type VARCHAR(50) DEFAULT 'general',
    ai_response TEXT,
    escalated BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    user_type VARCHAR(50) DEFAULT 'system',
    user_id VARCHAR(100),
    description TEXT NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users Table (for Dashboard Authentication)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Delivery Logs Table
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_next_billing_date ON contracts(next_billing_date);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_client_queries_customer_id ON client_queries(customer_id);
CREATE INDEX idx_email_logs_invoice_id ON email_logs(invoice_id);

-- Create Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply Updated At Triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Sample Data for Testing

-- Sample Customers
INSERT INTO customers (name, email, phone, address, city, state, zip_code, tax_id) VALUES
('Acme Corporation', 'billing@acme.com', '+1-555-0101', '100 Tech Boulevard', 'San Francisco', 'CA', '94105', '12-3456789'),
('Global Solutions Inc', 'accounts@globalsolutions.com', '+1-555-0102', '200 Business Ave', 'New York', 'NY', '10001', '98-7654321'),
('Tech Innovators LLC', 'finance@techinnovators.com', '+1-555-0103', '300 Innovation Drive', 'Austin', 'TX', '78701', '45-6789012');

-- Sample Contracts
INSERT INTO contracts (customer_id, contract_number, service_description, amount, billing_frequency, start_date, next_billing_date, tax_rate, discount_percentage) VALUES
((SELECT id FROM customers WHERE email = 'billing@acme.com'), 'CNT-2024-001', 'Cloud Infrastructure Services', 5000.00, 'monthly', '2024-01-01', '2024-12-08', 8.50, 0.00),
((SELECT id FROM customers WHERE email = 'accounts@globalsolutions.com'), 'CNT-2024-002', 'Enterprise Software License', 15000.00, 'quarterly', '2024-01-01', '2024-12-15', 10.00, 5.00),
((SELECT id FROM customers WHERE email = 'finance@techinnovators.com'), 'CNT-2024-003', 'Consulting Services', 8000.00, 'monthly', '2024-06-01', '2024-12-10', 7.00, 0.00);

-- Sample Admin User (password: admin123)
INSERT INTO admin_users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@billeragi.com', '$2b$10$rKZN5qJYZ5YqZ5YqZ5YqZeO5YqZ5YqZ5YqZ5YqZ5YqZ5YqZ5YqZ5Y', 'System Administrator', 'admin');

-- Note: The password hash above is a placeholder. The actual hash will be generated when creating the first admin user through the API.
