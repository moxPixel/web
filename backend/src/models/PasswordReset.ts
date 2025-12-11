import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/sequelize';
import User from './User';

interface PasswordResetAttributes {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type PasswordResetCreationAttributes = Optional<PasswordResetAttributes, 'id' | 'used' | 'createdAt' | 'updatedAt'>;

class PasswordReset
  extends Model<PasswordResetAttributes, PasswordResetCreationAttributes>
  implements PasswordResetAttributes
{
  public id!: string;
  public userId!: string;
  public token!: string;
  public expiresAt!: Date;
  public used!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PasswordReset.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'password_resets',
    modelName: 'PasswordReset',
  }
);

export default PasswordReset;

