import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum TrainingLevel {
  INITIATION = 'initiation',
  INTERMEDIAIRE = 'intermediaire',
  AVANCE = 'avance',
  EXPERT = 'expert',
}

export enum TrainingType {
  BOOTCAMP = 'bootcamp',
  ALTERNANCE = 'alternance',
  DIPLOMANTE = 'diplomante',
  CERTIFIANTE = 'certifiante',
}

export enum AudienceType {
  ENTREPRISE = 'entreprise',
  MONTER_EN_COMPETENCE = 'monter-en-competence',
  RECONVERSION = 'reconversion',
}

export enum LocationType {
  DISTANCIEL = 'distanciel',
  PRESENTIEL = 'presentiel',
  HYBRIDE = 'hybride',
}

class Training extends Model<
  InferAttributes<Training>,
  InferCreationAttributes<Training>
> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare shortTitle: string;
  declare slug: string;
  declare category?: string;
  declare level: TrainingLevel;
  declare trainingType: TrainingType;
  declare audienceType: AudienceType;
  declare tagline?: string;
  declare description?: string;
  declare objectives?: string[];
  declare targetAudience?: string[];
  declare prerequisites?: string[];
  declare outcomes?: string[];
  declare format?: string;
  declare durationDays?: number;
  declare durationHours?: number;
  declare durationLabel?: string;
  declare pace?: string;
  declare locationTypes?: LocationType[];
  declare priceFrom?: number;
  declare currency?: string;
  declare nextSessionHighlight?: string;
  declare heroImage?: string;
  declare watermarkLogo?: string;
  declare status: CreationOptional<'draft' | 'published' | 'archived'>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Training.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    shortTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    level: {
      type: DataTypes.ENUM(...Object.values(TrainingLevel)),
      allowNull: false,
    },
    trainingType: {
      type: DataTypes.ENUM(...Object.values(TrainingType)),
      allowNull: false,
    },
    audienceType: {
      type: DataTypes.ENUM(...Object.values(AudienceType)),
      allowNull: false,
    },
    tagline: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    objectives: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    targetAudience: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    prerequisites: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    outcomes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    format: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    durationHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    durationLabel: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pace: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    locationTypes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    priceFrom: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: 'EUR',
    },
    nextSessionHighlight: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    heroImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    watermarkLogo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
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
    modelName: 'Training',
    tableName: 'trainings',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['level'] },
      { fields: ['trainingType'] },
      { fields: ['status'] },
    ],
  }
);

export default Training;

