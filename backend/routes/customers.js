import express from 'express';
import { Customer } from '../database/models.js';
import { authenticateToken } from '../middleware/auth.js';
import auditManager from '../modules/audit/audit-manager.js';
import { logError } from '../modules/audit/logger.js';

const router = express.Router();

/**
 * Get all customers
 * GET /api/customers
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const customers = await Customer.findAll();

        res.json({
            success: true,
            count: customers.length,
            customers
        });
    } catch (error) {
        logError('Failed to fetch customers', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customers'
        });
    }
});

/**
 * Get customer by ID
 * GET /api/customers/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        res.json({
            success: true,
            customer
        });
    } catch (error) {
        logError('Failed to fetch customer', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer'
        });
    }
});

/**
 * Create new customer
 * POST /api/customers
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.create(req.body);

        // Log action
        await auditManager.logAdminAction(
            req.user.id,
            'CUSTOMER_CREATED',
            'customer',
            customer.id,
            `Customer created: ${customer.name}`,
            { email: customer.email }
        );

        res.status(201).json({
            success: true,
            customer
        });
    } catch (error) {
        logError('Failed to create customer', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create customer'
        });
    }
});

/**
 * Update customer
 * PUT /api/customers/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.update(req.params.id, req.body);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        // Log action
        await auditManager.logAdminAction(
            req.user.id,
            'CUSTOMER_UPDATED',
            'customer',
            customer.id,
            `Customer updated: ${customer.name}`
        );

        res.json({
            success: true,
            customer
        });
    } catch (error) {
        logError('Failed to update customer', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update customer'
        });
    }
});

/**
 * Delete customer (soft delete)
 * DELETE /api/customers/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.delete(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        // Log action
        await auditManager.logAdminAction(
            req.user.id,
            'CUSTOMER_DELETED',
            'customer',
            customer.id,
            `Customer deleted: ${customer.name}`
        );

        res.json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        logError('Failed to delete customer', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete customer'
        });
    }
});

export default router;
