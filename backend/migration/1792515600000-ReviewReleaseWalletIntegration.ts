import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

const PROJECT_RELEASE_CYCLE_ID = '00000000-0000-4000-8000-000000000001';
const PROJECT_RELEASE_CYCLE_NAME = 'Project Release Reviews';
const SOURCE_COLUMN = 'source_user_sprint_id';
const SOURCE_UNIQUE_INDEX = 'uq_hr_review_records_source_user_sprint';
const SOURCE_FOREIGN_KEY = 'fk_hr_review_records_source_user_sprint';

export class ReviewReleaseWalletIntegration1792515600000
  implements MigrationInterface
{
  name = 'ReviewReleaseWalletIntegration1792515600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('hr_review_records', SOURCE_COLUMN))) {
      await queryRunner.addColumn(
        'hr_review_records',
        new TableColumn({
          name: SOURCE_COLUMN,
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    let reviewRecords = await queryRunner.getTable('hr_review_records');
    if (!reviewRecords) {
      throw new Error('hr_review_records table is required for review integration');
    }

    if (!reviewRecords.indices.some((index) => index.name === SOURCE_UNIQUE_INDEX)) {
      await queryRunner.createIndex(
        reviewRecords,
        new TableIndex({
          name: SOURCE_UNIQUE_INDEX,
          columnNames: [SOURCE_COLUMN],
          isUnique: true,
        }),
      );
    }

    reviewRecords = await queryRunner.getTable('hr_review_records');
    if (!reviewRecords) {
      throw new Error('hr_review_records table disappeared during migration');
    }

    if (
      !reviewRecords.foreignKeys.some(
        (foreignKey) => foreignKey.name === SOURCE_FOREIGN_KEY,
      )
    ) {
      await queryRunner.createForeignKey(
        reviewRecords,
        new TableForeignKey({
          name: SOURCE_FOREIGN_KEY,
          columnNames: [SOURCE_COLUMN],
          referencedTableName: 'user_sprint',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    const existingCycle = (await queryRunner.query(
      'SELECT `name` FROM `hr_review_cycles` WHERE `id` = ? LIMIT 1',
      [PROJECT_RELEASE_CYCLE_ID],
    )) as Array<{ name: string }>;

    if (
      existingCycle.length > 0 &&
      existingCycle[0].name !== PROJECT_RELEASE_CYCLE_NAME
    ) {
      throw new Error(
        `Review cycle id ${PROJECT_RELEASE_CYCLE_ID} is already used by a manually managed cycle`,
      );
    }

    if (existingCycle.length === 0) {
      await queryRunner.query(
        'INSERT INTO `hr_review_cycles` (`id`, `name`, `startDate`, `endDate`, `status`, `isDeleted`) VALUES (?, ?, ?, ?, ?, ?)',
        [
          PROJECT_RELEASE_CYCLE_ID,
          PROJECT_RELEASE_CYCLE_NAME,
          '1970-01-01',
          '9999-12-31',
          'ACTIVE',
          false,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const reviewRecords = await queryRunner.getTable('hr_review_records');
    if (reviewRecords) {
      const foreignKey = reviewRecords.foreignKeys.find(
        (candidate) => candidate.name === SOURCE_FOREIGN_KEY,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey(reviewRecords, foreignKey);
      }

      const index = reviewRecords.indices.find(
        (candidate) => candidate.name === SOURCE_UNIQUE_INDEX,
      );
      if (index) {
        await queryRunner.dropIndex(reviewRecords, index);
      }

      if (reviewRecords.findColumnByName(SOURCE_COLUMN)) {
        await queryRunner.dropColumn(reviewRecords, SOURCE_COLUMN);
      }
    }

    const linkedRecords = (await queryRunner.query(
      'SELECT COUNT(*) AS `count` FROM `hr_review_records` WHERE `review_cycle_id` = ?',
      [PROJECT_RELEASE_CYCLE_ID],
    )) as Array<{ count: string | number }>;

    if (Number(linkedRecords[0]?.count ?? 0) === 0) {
      await queryRunner.query('DELETE FROM `hr_review_cycles` WHERE `id` = ?', [
        PROJECT_RELEASE_CYCLE_ID,
      ]);
    }
  }
}
