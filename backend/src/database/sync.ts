import { connectDatabase, syncDatabase } from './sequelize';
import { initializeModels } from '../models';
import { env } from '../config/env';
import { logger } from '../logger/logger';

/**
 * Script de synchronisation de la base de données
 * Synchronise automatiquement les modèles Sequelize avec la BDD MySQL
 */
const sync = async (): Promise<void> => {
  try {
    logger.info('🚀 Starting database synchronization...');

    // Connexion à la base de données
    await connectDatabase();

    // Initialiser les modèles et associations
    await initializeModels();

    // Synchroniser selon la configuration
    if (env.sequelize.forceSync) {
      logger.warn('⚠️  FORCE SYNC MODE - All tables will be dropped!');
      await syncDatabase({ force: true });
    } else if (env.sequelize.alterSync) {
      logger.info('🔄 ALTER SYNC MODE - Tables will be altered.');
      await syncDatabase({ alter: true });
    } else if (env.sequelize.sync) {
      logger.info('🔄 SYNC MODE - Tables will be created if they do not exist.');
      await syncDatabase();
    } else {
      logger.info('ℹ️  Sync disabled in configuration. Set DB_SYNC=true to enable.');
    }

    logger.info('✅ Database synchronization completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database synchronization failed:', error);
    process.exit(1);
  }
};

// Exécuter le script
sync();

