import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../database/sequelize';

export type EventStatus = 'draft' | 'published' | 'archived';
export type EventType = 'webinar' | 'atelier' | 'conference' | 'meetup' | 'portes-ouvertes' | 'autre';

class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare slug: string;
  declare excerpt?: string;
  declare description?: string;
  declare eventType: CreationOptional<EventType>;
  declare startDate: string; // ISO
  declare endDate?: string; // ISO
  declare location?: string;
  declare isOnline: CreationOptional<boolean>;
  declare registrationUrl?: string;
  declare coverImage?: string;
  declare highlight: CreationOptional<boolean>;
  declare status: CreationOptional<EventStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Event.init(
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
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    excerpt: {
      type: DataTypes.STRING(600),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eventType: {
      type: DataTypes.ENUM('webinar', 'atelier', 'conference', 'meetup', 'portes-ouvertes', 'autre'),
      allowNull: false,
      defaultValue: 'autre',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    registrationUrl: {
      type: DataTypes.STRING(800),
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    highlight: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    modelName: 'Event',
    tableName: 'events',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['status'] },
      { fields: ['startDate'] },
      { fields: ['eventType'] },
    ],
  },
);

export default Event;


