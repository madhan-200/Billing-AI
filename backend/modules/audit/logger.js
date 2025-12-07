import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'billeragi-backend' },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined logs
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Audit logs
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            level: 'info',
            maxsize: 10485760, // 10MB
            maxFiles: 10,
        }),
    ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
}

// Create specialized loggers
export const auditLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'billeragi-audit' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
        }),
    ],
});

export const aiLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'billeragi-ai' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'ai-decisions.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
        }),
    ],
});

// Helper functions
export const logInfo = (message, meta = {}) => {
    logger.info(message, meta);
};

export const logError = (message, error = null, meta = {}) => {
    if (error) {
        logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
        logger.error(message, meta);
    }
};

export const logWarning = (message, meta = {}) => {
    logger.warn(message, meta);
};

export const logDebug = (message, meta = {}) => {
    logger.debug(message, meta);
};

export default logger;
