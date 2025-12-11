import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../database/sequelize';

class TrainingModule extends Model<
  InferAttributes<TrainingModule>,
  InferCreationAttributes<TrainingModule>
> {
  declare id: CreationOptional<string>;
  declare trainingId: string;
  declare title: string;
  declare durationHours?: number;
  declare topics: CreationOptional<string[]>;
  declare order: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TrainingModule.init(
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    durationHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    topics: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    modelName: 'TrainingModule',
    tableName: 'training_modules',
    indexes: [
      { fields: ['trainingId'] },
      { fields: ['order'] },
    ],
  }
);

export default TrainingModule;

