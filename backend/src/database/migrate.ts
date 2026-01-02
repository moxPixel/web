import { connectDatabase, sequelize } from './sequelize';
import { logger } from '../logger/logger';
import { initializeModels } from '../models';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

import * as m001 from './migrations/001-create-events';
import * as m002 from './migrations/002-alter-trainings-text-columns';

type Migration = {
  id: string;
  up: (queryInterface: any, Sequelize: any) => Promise<void>;
};

const migrations: Migration[] = [
  { id: (m001 as any).id, up: (m001 as any).up },
  { id: (m002 as any).id, up: (m002 as any).up },
];

const ensureMigrationsTable = async (): Promise<void> => {
  const qi = sequelize.getQueryInterface();
  const tables = await qi.showAllTables();
  const has = (tables as any[]).some((t) => String(t).toLowerCase() === 'schema_migrations');
  if (has) return;
  await qi.createTable('schema_migrations', {
    id: { type: DataTypes.STRING(200), primaryKey: true, allowNull: false },
    executedAt: { type: DataTypes.DATE, allowNull: false },
  });
};

const getApplied = async (): Promise<Set<string>> => {
  const rows = (await sequelize.query('SELECT id FROM schema_migrations', { type: QueryTypes.SELECT })) as Array<{ id: string }>;
  return new Set(rows.map((r) => r.id));
};

const recordApplied = async (id: string): Promise<void> => {
  await sequelize.getQueryInterface().sequelize.query(
    'INSERT INTO schema_migrations (id, executedAt) VALUES (?, ?)',
    { replacements: [id, new Date()] },
  );
};

const migrate = async (): Promise<void> => {
  try {
    logger.info('🚀 Starting migrations...');
    await connectDatabase();
    await initializeModels();

    await ensureMigrationsTable();
    const applied = await getApplied();

    for (const m of migrations) {
      if (applied.has(m.id)) {
        logger.info(`ℹ️  Migration already applied: ${m.id}`);
        continue;
      }
      logger.info(`➡️  Applying migration: ${m.id}`);
      await m.up(sequelize.getQueryInterface(), Sequelize as any);
      await recordApplied(m.id);
      logger.info(`✅ Migration applied: ${m.id}`);
    }

    logger.info('✅ Migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migrations failed:', error);
    process.exit(1);
  }
};

migrate();


