import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../database/sequelize';
import User from './User';

class Individual extends Model<
  InferAttributes<Individual>,
  InferCreationAttributes<Individual>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare dateOfBirth?: Date;
  declare phone?: string;
  declare address?: string;
  declare city?: string;
  declare postalCode?: string;
  declare country?: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Individual.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'France',
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
    modelName: 'Individual',
    tableName: 'individuals',
    indexes: [{ fields: ['userId'], unique: true }],
  }
);

// Association 1:1 avec User
User.hasOne(Individual, {
  foreignKey: 'userId',
  as: 'individualProfile',
  onDelete: 'CASCADE',
});
Individual.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export default Individual;

