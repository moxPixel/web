import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { connectDatabase, syncDatabase } from './database/sequelize';
import { initializeModels } from './models';
import { env } from './config/env';
import { logger } from './logger/logger';
import { requestLogger, errorLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter, uploadLimiter, createLimiter } from './middleware/rate-limit.middleware';

const app: Express = express();

// Configuration CORS restrictive
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = env.allowedOrigins.split(',').map((o) => o.trim());
    
    // En développement, autoriser localhost sans origin (Postman, etc.)
    if (env.nodeEnv === 'development' && !origin) {
      return callback(null, true);
    }
    
    // Autoriser les origines configurées
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares de sécurité et performance
// Configuration Helmet pour permettre l'accès aux images uploadées
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Désactiver CSP pour les fichiers statiques (images) pour éviter les conflits
  contentSecurityPolicy: false,
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/upload', uploadLimiter);

// Logger middleware
app.use(requestLogger);

// Routes de santé avancées
app.get('/health', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};
  let allOk = true;

  // Vérifier la connexion à la base de données
  try {
    await connectDatabase();
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    allOk = false;
    logger.error('Health check: Database connection failed', error);
  }

  // Vérifier l'accès au disque (dossier uploads)
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    checks.disk = 'ok';
  } catch (error) {
    checks.disk = 'error';
    allOk = false;
    logger.error('Health check: Disk access failed', error);
  }

  // Vérifier l'accès aux logs
  try {
    const logsDir = path.dirname(env.logging.file);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    checks.logs = 'ok';
  } catch (error) {
    checks.logs = 'error';
    allOk = false;
    logger.error('Health check: Logs directory access failed', error);
  }

  const statusCode = allOk ? 200 : 503;
  res.status(statusCode).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    checks,
  });
});

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Unlock Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      trainings: '/api/trainings',
      certifications: '/api/certifications',
      sessions: '/api/sessions',
      contacts: '/api/contacts',
    },
  });
});

// Routes API
import trainingsRoutes from './routes/trainings.routes';
import certificationsRoutes from './routes/certifications.routes';
import sessionsRoutes from './routes/sessions.routes';
import uploadRoutes from './routes/upload.routes';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import contactsRoutes from './routes/contacts.routes';
import aiRoutes from './routes/ai.routes';
import enrollmentsRoutes from './routes/enrollments.routes';
import mailRoutes from './routes/mail.routes';
import orientationRoutes from './routes/orientation.routes';

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/trainings', trainingsRoutes);
app.use('/api/certifications', certificationsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/orientation', orientationRoutes);

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, filePath) => {
    // Permettre l'accès aux images depuis le frontend (CORS)
    const allowedOrigins = env.allowedOrigins.split(',').map((o) => o.trim());
    const origin = res.req?.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (env.nodeEnv === 'development') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 an
  },
}));

// Middleware d'erreur (doit être en dernier)
app.use(errorLogger);
app.use(errorHandler);

// Initialiser le serveur
const startServer = async (): Promise<void> => {
  try {
    // Connexion à la base de données
    logger.info('🔌 Connecting to database...');
    await connectDatabase();

    // Initialiser les modèles
    logger.info('📦 Initializing models...');
    await initializeModels();

    // Synchroniser la base de données si configuré
    if (env.sequelize.sync) {
      logger.info('🔄 Synchronizing database...');
      await syncDatabase({
        force: env.sequelize.forceSync,
        alter: env.sequelize.alterSync,
      });
    } else {
      logger.info('ℹ️  Database sync disabled. Use npm run db:sync to sync manually.');
    }

    // Démarrer le serveur
    app.listen(env.port, () => {
      logger.info(`🚀 Server running on port ${env.port}`);
      logger.info(`📝 Environment: ${env.nodeEnv}`);
      logger.info(`🔗 API: http://localhost:${env.port}/api`);
      logger.info(`❤️  Health: http://localhost:${env.port}/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Démarrer le serveur
startServer();

export default app;

