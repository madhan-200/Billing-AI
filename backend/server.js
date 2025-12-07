import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './database/connection.js';
import logger, { logInfo, logError } from './modules/audit/logger.js';
import billingScheduler from './modules/scheduler/billing-scheduler.js';
import reminderScheduler from './modules/scheduler/reminder-scheduler.js';

// Import routes
import authRoutes from './routes/auth.js';
import invoiceRoutes from './routes/invoices.js';
import customerRoutes from './routes/customers.js';
import paymentRoutes from './routes/payments.js';
import aiInsightsRoutes from './routes/ai-insights.js';
import auditRoutes from './routes/audit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    logInfo(`${req.method} ${req.path}`, {
        ip: req.ip,
        user_agent: req.get('user-agent')
    });
    next();
});

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'BillerAGI Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/insights', aiInsightsRoutes);
app.use('/api/audit', auditRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to BillerAGI API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            invoices: '/api/invoices',
            customers: '/api/customers',
            payments: '/api/payments',
            insights: '/api/insights',
            audit: '/api/audit'
        }
    });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logError('Unhandled error', err, {
        path: req.path,
        method: req.method
    });

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// ==================== SERVER STARTUP ====================

const startServer = async () => {
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        logInfo('✅ Database connection successful');

        // Start schedulers
        billingScheduler.start();
        logInfo('✅ Billing scheduler started');

        reminderScheduler.start();
        logInfo('✅ Reminder scheduler started');

        // Start Express server
        app.listen(PORT, () => {
            logInfo(`🚀 BillerAGI Backend running on port ${PORT}`);
            console.log(`\n${'='.repeat(50)}`);
            console.log(`🚀 BillerAGI Backend Server`);
            console.log(`${'='.repeat(50)}`);
            console.log(`📍 Server URL: http://localhost:${PORT}`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`📚 API Docs: http://localhost:${PORT}/`);
            console.log(`${'='.repeat(50)}\n`);
        });
    } catch (error) {
        logError('Failed to start server', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logInfo('SIGTERM received, shutting down gracefully');
    pool.end(() => {
        logInfo('Database pool closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logInfo('SIGINT received, shutting down gracefully');
    pool.end(() => {
        logInfo('Database pool closed');
        process.exit(0);
    });
});

// Start the server
startServer();

export default app;
