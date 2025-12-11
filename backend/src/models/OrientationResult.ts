import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../database/sequelize';
import {
  FormationMatch,
  OrientationKpiResult,
  OrientationProfileType,
  OrientationSummary,
} from '../types/orientation.types';

class OrientationResult extends Model<
  InferAttributes<OrientationResult>,
  InferCreationAttributes<OrientationResult>
> {
  declare id: CreationOptional<string>;
  declare profileType: OrientationProfileType;
  declare rawAnswers: Record<string, unknown>;
  declare kpis: OrientationKpiResult;
  declare formations: FormationMatch[];
  declare aiReport: string;
  declare summary: OrientationSummary;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

OrientationResult.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    profileType: {
      type: DataTypes.ENUM(
        'particulier',
        'etudiant',
        'entreprise',
        'porteur-projet',
        'etranger',
      ),
      allowNull: false,
    },
    rawAnswers: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    kpis: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    formations: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    aiReport: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    summary: {
      type: DataTypes.JSON,
      allowNull: false,
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
    modelName: 'OrientationResult',
    tableName: 'orientation_results',
    indexes: [
      { fields: ['profileType'] },
      { fields: ['createdAt'] },
    ],
  },
);

export default OrientationResult;
