import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../database/sequelize';
import User from './User';

class Trainer extends Model<
  InferAttributes<Trainer>,
  InferCreationAttributes<Trainer>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare siret?: string;
  declare specialties?: string[]; // Array of specialties
  declare certifications?: string[]; // Array of certifications
  declare yearsOfExperience?: number;
  declare bio?: string;
  declare phone?: string;
  declare address?: string;
  declare city?: string;
  declare postalCode?: string;
  declare country?: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Trainer.init(
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
    siret: {
      type: DataTypes.STRING(14),
      allowNull: true,
      unique: true,
    },
    specialties: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    certifications: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
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
    modelName: 'Trainer',
    tableName: 'trainers',
    indexes: [{ fields: ['userId'], unique: true }],
  }
);

// Association 1:1 avec User
User.hasOne(Trainer, {
  foreignKey: 'userId',
  as: 'trainerProfile',
  onDelete: 'CASCADE',
});
Trainer.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export default Trainer;

