import { sequelize } from './sequelize';
import { initializeModels } from '../models';
import User, { UserStatus, UserRole } from '../models/User';
import { hashPassword } from '../utils/password.util';
import { logger } from '../logger/logger';
import { env } from '../config/env';

/**
 * Seed initial de l'admin
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    logger.info('🌱 Starting database seeding...');

    // Initialiser les modèles
    await initializeModels();

    // Créer l'admin par défaut si n'existe pas
    const adminEmail = env.security.adminEmail || 'admin@unlock.fr';
    const adminPassword = env.security.adminPassword || 'Admin123!@#';

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashedPassword = await hashPassword(adminPassword);
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Unlock',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });
      logger.info(`✅ Admin user created: ${adminEmail}`);
      logger.warn(`⚠️  Default admin password: ${adminPassword} - CHANGE IT IN PRODUCTION!`);
    } else {
      logger.info(`ℹ️  Admin user already exists: ${adminEmail}`);
    }

    logger.info('✅ Database seeding completed successfully.');
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Exécuter le seed si appelé directement
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}
