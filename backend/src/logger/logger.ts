import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

// Créer le dossier logs s'il n'existe pas
const logsDir = path.dirname(env.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Format pour la console (plus lisible)
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

// Configuration des transports
const transports: winston.transport[] = [
  // Fichier pour tous les logs
  new winston.transports.File({
    filename: env.logging.file,
    level: env.logging.level,
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Fichier séparé pour les erreurs
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880,
    maxFiles: 5,
  }),
];

// En développement, ajouter aussi la console
if (env.nodeEnv !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: env.logging.level,
      format: consoleFormat,
    })
  );
}

// Créer le logger
export const logger = winston.createLogger({
  level: env.logging.level,
  format: logFormat,
  defaultMeta: { service: 'unlock-backend' },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

// Helper pour logger les requêtes HTTP
export const logRequest = (method: string, url: string, statusCode: number, duration: number) => {
  logger.info('HTTP Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  });
};

// Helper pour logger les erreurs
export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export default logger;

