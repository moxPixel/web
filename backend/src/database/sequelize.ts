import { Sequelize } from 'sequelize';
import { env } from '../config/env';
import { logger } from '../logger/logger';

// Créer l'instance Sequelize
export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: env.db.dialect,
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false,
    },
  }
);

// Tester la connexion
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Synchroniser la base de données
export const syncDatabase = async (options?: {
  force?: boolean;
  alter?: boolean;
}): Promise<void> => {
  try {
    const { force = false, alter = false } = options || {};

    if (force) {
      logger.warn('⚠️  Force sync enabled - This will drop all tables!');
    } else if (alter) {
      logger.info('🔄 Alter sync enabled - Tables will be altered to match models.');
    } else {
      logger.info('🔄 Sync enabled - Tables will be created if they do not exist.');
    }

    await sequelize.sync({ force, alter });
    logger.info('✅ Database synchronized successfully.');
  } catch (error) {
    logger.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

export default sequelize;

