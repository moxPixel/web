import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum EnrollmentStatus {
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export type EnrollmentRole = 'individual' | 'company' | 'trainer' | 'candidate';

class TrainingEnrollment extends Model<
  InferAttributes<TrainingEnrollment>,
  InferCreationAttributes<TrainingEnrollment>
> {
  declare id: CreationOptional<string>;
  declare trainingId: string;
  declare sessionId: string | null;
  declare userId: string | null;
  declare role: EnrollmentRole;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare phone?: string;
  declare companyName?: string;
  declare jobTitle?: string;
  declare siret?: string;
  declare teamSize?: string;
  declare message?: string;
  declare preferredFormat?: string;
  declare desiredDate?: Date | null;
  declare objectives?: string;
  declare status: EnrollmentStatus;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TrainingEnrollment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    trainingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'trainings', key: 'id' },
      onDelete: 'CASCADE',
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'training_sessions', key: 'id' },
      onDelete: 'SET NULL',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    role: {
      type: DataTypes.ENUM('individual', 'company', 'trainer', 'candidate'),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    siret: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    teamSize: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    preferredFormat: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    desiredDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    objectives: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EnrollmentStatus)),
      allowNull: false,
      defaultValue: EnrollmentStatus.SUBMITTED,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'TrainingEnrollment',
    tableName: 'training_enrollments',
    indexes: [
      { fields: ['trainingId'] },
      { fields: ['sessionId'] },
      { fields: ['userId'] },
      { fields: ['email'] },
      { fields: ['status'] },
      {
        unique: true,
        fields: ['trainingId', 'sessionId', 'email'],
        name: 'uniq_enrollment_training_session_email',
      },
    ],
  }
);

export default TrainingEnrollment;

