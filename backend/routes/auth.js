import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../database/models.js';
import { authenticateToken } from '../middleware/auth.js';
import { logInfo, logError } from '../modules/audit/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * Register new admin user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await AdminUser.findByUsername(username);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Username already exists'
            });
        }

        const existingEmail = await AdminUser.findByEmail(email);
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                error: 'Email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await AdminUser.create({
            username,
            email,
            password_hash,
            full_name: full_name || username,
            role: 'admin'
        });

        logInfo('New admin user registered', { user_id: user.id, username });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        logError('User registration failed', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
    }
});

/**
 * Login
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }

        // Find user
        const user = await AdminUser.findByUsername(username);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Update last login
        await AdminUser.updateLastLogin(user.id);

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        logInfo('User logged in', { user_id: user.id, username });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        logError('Login failed', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});

/**
 * Verify token
 * GET /api/auth/verify
 */
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

/**
 * Logout (client-side token removal)
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, (req, res) => {
    logInfo('User logged out', { user_id: req.user.id });

    res.json({
        success: true,
        message: 'Logout successful'
    });
});

export default router;
