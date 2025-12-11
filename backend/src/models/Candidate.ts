import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../database/sequelize';
import User from './User';

class Candidate extends Model<
  InferAttributes<Candidate>,
  InferCreationAttributes<Candidate>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare dateOfBirth?: Date;
  declare educationLevel?: string; // Bac, Bac+2, Bac+3, Bac+5, etc.
  declare cv?: string; // URL or path to CV file
  declare coverLetter?: string; // URL or path to cover letter
  declare phone?: string;
  declare address?: string;
  declare city?: string;
  declare postalCode?: string;
  declare country?: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Candidate.init(
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
    educationLevel: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    cv: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    coverLetter: {
      type: DataTypes.STRING(500),
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
    modelName: 'Candidate',
    tableName: 'candidates',
    indexes: [{ fields: ['userId'], unique: true }],
  }
);

// Association 1:1 avec User
User.hasOne(Candidate, {
  foreignKey: 'userId',
  as: 'candidateProfile',
  onDelete: 'CASCADE',
});
Candidate.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export default Candidate;

