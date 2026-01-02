import { DataTypes } from 'sequelize';

export const id = '002-alter-trainings-text-columns';

export async function up(queryInterface: any): Promise<void> {
  // NOTE: keep this migration idempotent-ish; changeColumn is safe to re-run for same definition.
  const tables = await queryInterface.showAllTables();
  const has = (tables as any[]).some((t) => String(t).toLowerCase() === 'trainings');
  if (!has) return;

  await queryInterface.changeColumn('trainings', 'category', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  });

  await queryInterface.changeColumn('trainings', 'format', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  });

  await queryInterface.changeColumn('trainings', 'durationLabel', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  });

  await queryInterface.changeColumn('trainings', 'pace', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  });

  await queryInterface.changeColumn('trainings', 'nextSessionHighlight', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  });

  await queryInterface.changeColumn('trainings', 'heroImage', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  });

  await queryInterface.changeColumn('trainings', 'watermarkLogo', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  });
}


