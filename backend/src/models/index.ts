import { sequelize } from '../database/sequelize';
import { logger } from '../logger/logger';

// Importer tous les modèles
import Training from './Training';
import Certification from './Certification';
import TrainingSession from './TrainingSession';
import TrainingModule from './TrainingModule';
import User from './User';
import Individual from './Individual';
import Company from './Company';
import Trainer from './Trainer';
import Candidate from './Candidate';
import Contact from './Contact';
import TrainingEnrollment from './TrainingEnrollment';
import PasswordReset from './PasswordReset';
import OrientationResult from './OrientationResult';

// Définir les associations
const defineAssociations = (): void => {
  try {
    // Training -> TrainingSession (One-to-Many)
    Training.hasMany(TrainingSession, {
      foreignKey: 'trainingId',
      as: 'sessions',
    });
    TrainingSession.belongsTo(Training, {
      foreignKey: 'trainingId',
      as: 'training',
    });

    // Training -> TrainingModule (One-to-Many)
    Training.hasMany(TrainingModule, {
      foreignKey: 'trainingId',
      as: 'modules',
    });
    TrainingModule.belongsTo(Training, {
      foreignKey: 'trainingId',
      as: 'training',
    });

    // Les associations User <-> Profiles sont définies dans les fichiers de modèles individuels
    // (Individual.ts, Company.ts, Trainer.ts, Candidate.ts)

    // Contact -> User (Many-to-One) pour respondedBy
    Contact.belongsTo(User, {
      foreignKey: 'respondedBy',
      as: 'responder',
    });
    User.hasMany(Contact, {
      foreignKey: 'respondedBy',
      as: 'respondedContacts',
    });

    // TrainingEnrollment relations
    // Note: belongsToMany retiré car redondant avec hasMany/belongsTo
    Training.hasMany(TrainingEnrollment, { foreignKey: 'trainingId', as: 'enrollments' });
    TrainingSession.hasMany(TrainingEnrollment, { foreignKey: 'sessionId', as: 'enrollments' });
    TrainingEnrollment.belongsTo(Training, { foreignKey: 'trainingId', as: 'training' });
    TrainingEnrollment.belongsTo(TrainingSession, { foreignKey: 'sessionId', as: 'session' });
    TrainingEnrollment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(TrainingEnrollment, { foreignKey: 'userId', as: 'enrollments' });

    // Password reset
    PasswordReset.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(PasswordReset, { foreignKey: 'userId', as: 'passwordResets' });

    logger.info('✅ Model associations defined successfully.');
  } catch (error) {
    logger.error('❌ Error defining model associations:', error);
    throw error;
  }
};

// Initialiser les modèles et associations
export const initializeModels = async (): Promise<void> => {
  try {
    defineAssociations();
    logger.info('✅ Models initialized successfully.');
  } catch (error) {
    logger.error('❌ Error initializing models:', error);
    throw error;
  }
};

// Exporter tous les modèles
export {
  Training,
  Certification,
  TrainingSession,
  TrainingModule,
  User,
  Individual,
  Company,
  Trainer,
  Candidate,
  Contact,
  TrainingEnrollment,
  PasswordReset,
  OrientationResult,
};

export default {
  Training,
  Certification,
  TrainingSession,
  TrainingModule,
  User,
  Individual,
  Company,
  Trainer,
  Candidate,
  Contact,
  TrainingEnrollment,
  PasswordReset,
  OrientationResult,
  sequelize,
};
