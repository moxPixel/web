import type { QueryInterface, Sequelize } from 'sequelize';
import { DataTypes } from 'sequelize';

export const id = '001-create-events';

export async function up(queryInterface: QueryInterface, Sequelize: typeof Sequelize): Promise<void> {
  // Create table only if it doesn't exist (safe re-run)
  const tables = await queryInterface.showAllTables();
  const has = (tables as any[]).some((t) => String(t).toLowerCase() === 'events');
  if (has) return;

  await queryInterface.createTable('events', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('events', ['slug'], { unique: true });
  await queryInterface.addIndex('events', ['status']);
  await queryInterface.addIndex('events', ['startDate']);
  await queryInterface.addIndex('events', ['eventType']);
}


