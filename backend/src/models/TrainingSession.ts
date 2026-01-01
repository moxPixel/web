import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

class TrainingSession extends Model<
  InferAttributes<TrainingSession>,
  InferCreationAttributes<TrainingSession>
> {
  declare id: CreationOptional<string>;
  declare trainingId: string;
  declare startDate: Date;
  declare endDate: Date;
  declare location?: string;
  declare seats?: number;
  declare seatsAvailable?: number;
  declare price?: number;
  declare status: SessionStatus;
  declare highlight: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TrainingSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    trainingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'trainings',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    seats: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    seatsAvailable: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      // Sequelize DECIMAL often serializes to string; ensure API returns a number (front expects number).
      get() {
        const raw = this.getDataValue('price') as unknown as string | number | null;
        if (raw === null || raw === undefined) return null;
        const n = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(n) ? n : null;
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SessionStatus)),
      allowNull: false,
      defaultValue: SessionStatus.SCHEDULED,
    },
    highlight: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    modelName: 'TrainingSession',
    tableName: 'training_sessions',
    indexes: [
      { fields: ['trainingId'] },
      { fields: ['startDate'] },
      { fields: ['status'] },
      { fields: ['highlight'] },
    ],
  }
);

export default TrainingSession;

