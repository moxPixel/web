import dotenv from 'dotenv';

// Charger .env mais NE PAS surcharger les variables d'environnement existantes
// Cela permet à PM2 (--env production) de définir NODE_ENV sans être écrasé par le .env
dotenv.config({ override: false });

interface EnvConfig {
  nodeEnv: string;
  port: number;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    dialect: 'mysql';
  };
  sequelize: {
    sync: boolean;
    forceSync: boolean;
    alterSync: boolean;
  };
  logging: {
    level: string;
    file: string;
  };
  security: {
    jwtSecret: string;
    apiKey: string;
    adminEmail?: string;
    adminPassword?: string;
  };
  allowedOrigins: string;
  openai: {
    apiKey?: string;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromName: string;
  };
  franceCompetences: {
    apiEnabled?: boolean;
    apiKey?: string;
  };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  const hasValue = value !== undefined && value !== null && value !== '';
  if (!hasValue && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return hasValue ? (value as string) : (defaultValue ?? '');
};

export const env: EnvConfig = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: parseInt(getEnvVar('PORT', '4000'), 10),
  db: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: parseInt(getEnvVar('DB_PORT', '3306'), 10),
    name: getEnvVar('DB_NAME', 'unlock_db'),
    user: getEnvVar('DB_USER', 'root'),
    password: getEnvVar('DB_PASSWORD', ''),
    dialect: 'mysql' as const,
  },
  sequelize: {
    sync: getEnvVar('DB_SYNC', 'false') === 'true',
    forceSync: getEnvVar('DB_FORCE_SYNC', 'false') === 'true',
    alterSync: getEnvVar('DB_ALTER_SYNC', 'false') === 'true',
  },
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    file: getEnvVar('LOG_FILE', 'logs/app.log'),
  },
  security: {
    jwtSecret: getEnvVar('JWT_SECRET', 'change-me-in-production'),
    apiKey: getEnvVar('API_KEY', 'change-me-in-production'),
    adminEmail: getEnvVar('ADMIN_EMAIL', 'admin@unlock.fr'),
    adminPassword: getEnvVar('ADMIN_PASSWORD', 'Admin123!@#'),
  },
  allowedOrigins: getEnvVar('ALLOWED_ORIGINS', 'http://localhost:4200'),
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY', ''),
  },
  email: {
    host: getEnvVar('SMTP_HOST', 'smtp.ionos.fr'),
    port: parseInt(getEnvVar('SMTP_PORT', '465'), 10),
    secure: getEnvVar('SMTP_SECURE', 'true') === 'true',
    // Do NOT ship real credentials in code defaults.
    user: getEnvVar('SMTP_USER', ''),
    password: getEnvVar('SMTP_PASSWORD', ''),
    fromName: getEnvVar('SMTP_FROM_NAME', 'Unlock Formation'),
  },
  franceCompetences: {
    apiEnabled: getEnvVar('FRANCE_COMPETENCES_ENABLED', 'true') === 'true',
    apiKey: getEnvVar('FRANCE_COMPETENCES_API_KEY', ''),
  },
};

export default env;

