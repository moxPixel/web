import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../database/sequelize';
import User from './User';

class Company extends Model<
  InferAttributes<Company>,
  InferCreationAttributes<Company>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare siret: string;
  declare companyName: string;
  declare legalForm?: string; // SARL, SAS, SA, etc.
  declare address?: string;
  declare city?: string;
  declare postalCode?: string;
  declare country?: string;
  declare phone?: string;
  declare website?: string;
  declare numberOfEmployees?: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Company.init(
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
      allowNull: false,
      unique: true,
    },
    companyName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    legalForm: {
      type: DataTypes.STRING(50),
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
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    numberOfEmployees: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    modelName: 'Company',
    tableName: 'companies',
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['siret'], unique: true },
    ],
  }
);

// Association 1:1 avec User
User.hasOne(Company, {
  foreignKey: 'userId',
  as: 'companyProfile',
  onDelete: 'CASCADE',
});
Company.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export default Company;

