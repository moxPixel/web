import type { QueryInterface } from 'sequelize';
import type { Sequelize } from 'sequelize';

export const id = '001-create-events';

export async function up(queryInterface: QueryInterface, Sequelize: Sequelize): Promise<void> {
  // Create table only if it doesn't exist (safe re-run)
  const tables = await queryInterface.showAllTables();
  const has = (tables as any[]).some((t) => String(t).toLowerCase() === 'events');
  if (has) return;

  await queryInterface.createTable('events', {
    id: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: Sequelize.DataTypes.STRING(500),
      allowNull: false,
    },
    slug: {
      type: Sequelize.DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    excerpt: {
      type: Sequelize.DataTypes.STRING(600),
      allowNull: true,
    },
    description: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true,
    },
    eventType: {
      type: Sequelize.DataTypes.ENUM('webinar', 'atelier', 'conference', 'meetup', 'portes-ouvertes', 'autre'),
      allowNull: false,
      defaultValue: 'autre',
    },
    startDate: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
    },
    location: {
      type: Sequelize.DataTypes.STRING(200),
      allowNull: true,
    },
    isOnline: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    registrationUrl: {
      type: Sequelize.DataTypes.STRING(800),
      allowNull: true,
    },
    coverImage: {
      type: Sequelize.DataTypes.STRING(500),
      allowNull: true,
    },
    highlight: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: Sequelize.DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('events', ['slug'], { unique: true });
  await queryInterface.addIndex('events', ['status']);
  await queryInterface.addIndex('events', ['startDate']);
  await queryInterface.addIndex('events', ['eventType']);
}


