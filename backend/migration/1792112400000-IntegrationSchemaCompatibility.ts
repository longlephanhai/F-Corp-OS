import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

const USER_SPRINT_STATUSES = [
  'requested',
  'pending_approval',
  'assigned',
  'declined',
  'released',
];

export class IntegrationSchemaCompatibility1792112400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasLegacyBaseline = await this.ensureLegacyBaseline(queryRunner);

    if (!hasLegacyBaseline) {
      return;
    }

    await this.ensureProjectManagers(queryRunner);
    await this.ensureUserSprintCompatibility(queryRunner);
    await this.ensureTaskCompatibility(queryRunner);
  }

  public down(): Promise<void> {
    return Promise.reject(
      new Error(
        'IntegrationSchemaCompatibility cannot be reverted safely because it only adds compatibility structures that may contain production data.',
      ),
    );
  }

  private async ensureLegacyBaseline(
    queryRunner: QueryRunner,
  ): Promise<boolean> {
    const requiredTables = ['projects', 'users', 'user_sprint', 'tasks'];
    const missingTables: string[] = [];

    for (const tableName of requiredTables) {
      if (!(await queryRunner.hasTable(tableName))) {
        missingTables.push(tableName);
      }
    }

    if (missingTables.length === requiredTables.length) {
      return false;
    }

    if (missingTables.length > 0) {
      throw new Error(
        `Legacy database baseline is missing required tables: ${missingTables.join(', ')}. Restore the legacy baseline before running integration migrations.`,
      );
    }

    return true;
  }

  private async ensureProjectManagers(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('project_managers'))) {
      await queryRunner.createTable(
        new Table({
          name: 'project_managers',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
            },
            {
              name: 'project_id',
              type: 'varchar',
              length: '36',
            },
            {
              name: 'user_id',
              type: 'varchar',
              length: '36',
            },
            {
              name: 'manager_role',
              type: 'enum',
              enum: ['PRIMARY', 'CO_MANAGER'],
              default: "'CO_MANAGER'",
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          indices: [
            {
              name: 'uq_project_manager_project_user',
              columnNames: ['project_id', 'user_id'],
              isUnique: true,
            },
            {
              name: 'idx_project_manager_project',
              columnNames: ['project_id'],
            },
            {
              name: 'idx_project_manager_user',
              columnNames: ['user_id'],
            },
          ],
          foreignKeys: [
            {
              name: 'fk_project_managers_project',
              columnNames: ['project_id'],
              referencedTableName: 'projects',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              name: 'fk_project_managers_user',
              columnNames: ['user_id'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
          ],
        }),
        true,
      );

      return;
    }

    await this.addColumnIfMissing(
      queryRunner,
      'project_managers',
      new TableColumn({
        name: 'id',
        type: 'varchar',
        length: '36',
        isPrimary: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'project_managers',
      new TableColumn({
        name: 'project_id',
        type: 'varchar',
        length: '36',
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'project_managers',
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'project_managers',
      new TableColumn({
        name: 'manager_role',
        type: 'enum',
        enum: ['PRIMARY', 'CO_MANAGER'],
        default: "'CO_MANAGER'",
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'project_managers',
      new TableColumn({
        name: 'created_at',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
      }),
    );

    await this.ensureProjectManagerIndexes(queryRunner);
    await this.ensureProjectManagerForeignKeys(queryRunner);
  }

  private async ensureProjectManagerIndexes(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const table = await queryRunner.getTable('project_managers');

    if (!table) {
      throw new Error('project_managers table disappeared during migration');
    }

    const hasManagerUnique =
      table.indices.some(
        (index) =>
          index.isUnique &&
          this.hasSameColumns(index.columnNames, ['project_id', 'user_id']),
      ) ||
      table.uniques.some((unique) =>
        this.hasSameColumns(unique.columnNames, ['project_id', 'user_id']),
      );

    if (!hasManagerUnique) {
      await queryRunner.createIndex(
        table,
        new TableIndex({
          name: 'uq_project_manager_project_user',
          columnNames: ['project_id', 'user_id'],
          isUnique: true,
        }),
      );
    }

    await this.addIndexIfMissing(queryRunner, table, {
      name: 'idx_project_manager_project',
      columnNames: ['project_id'],
    });
    await this.addIndexIfMissing(queryRunner, table, {
      name: 'idx_project_manager_user',
      columnNames: ['user_id'],
    });
  }

  private async ensureProjectManagerForeignKeys(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const table = await queryRunner.getTable('project_managers');

    if (!table) {
      throw new Error('project_managers table disappeared during migration');
    }

    const foreignKeys = [
      {
        name: 'fk_project_managers_project',
        columnName: 'project_id',
        referencedTableName: 'projects',
      },
      {
        name: 'fk_project_managers_user',
        columnName: 'user_id',
        referencedTableName: 'users',
      },
    ];

    for (const definition of foreignKeys) {
      const exists = table.foreignKeys.some(
        (foreignKey) =>
          foreignKey.columnNames.includes(definition.columnName) &&
          foreignKey.referencedTableName === definition.referencedTableName,
      );

      if (!exists) {
        await queryRunner.createForeignKey(
          table,
          new TableForeignKey({
            name: definition.name,
            columnNames: [definition.columnName],
            referencedTableName: definition.referencedTableName,
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }
    }
  }

  private async ensureUserSprintCompatibility(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const userSprint = await queryRunner.getTable('user_sprint');

    if (!userSprint) {
      throw new Error('user_sprint table disappeared during migration');
    }

    const statusColumn = userSprint.findColumnByName('status');

    if (!statusColumn) {
      await queryRunner.addColumn(
        userSprint,
        new TableColumn({
          name: 'status',
          type: 'enum',
          enum: USER_SPRINT_STATUSES,
          default: "'requested'",
        }),
      );
    } else if (
      statusColumn.type !== 'enum' ||
      USER_SPRINT_STATUSES.some(
        (status) => !(statusColumn.enum ?? []).includes(status),
      )
    ) {
      const rows = (await queryRunner.query(
        'SELECT DISTINCT `status` FROM `user_sprint` WHERE `status` IS NOT NULL',
      )) as Array<{ status: string }>;
      const invalidStatuses = rows
        .map((row) => row.status)
        .filter((status) => !USER_SPRINT_STATUSES.includes(status));

      if (invalidStatuses.length > 0) {
        throw new Error(
          `user_sprint contains unsupported statuses: ${invalidStatuses.join(', ')}`,
        );
      }

      await queryRunner.changeColumn(
        userSprint,
        statusColumn,
        new TableColumn({
          name: 'status',
          type: 'enum',
          enum: USER_SPRINT_STATUSES,
          default: "'requested'",
        }),
      );
    }

    await this.addColumnIfMissing(
      queryRunner,
      'user_sprint',
      new TableColumn({
        name: 'percitant',
        type: 'float',
        default: 100,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'user_sprint',
      new TableColumn({
        name: 'hard_skill_rate',
        type: 'int',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'user_sprint',
      new TableColumn({
        name: 'soft_skill_rate',
        type: 'int',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'user_sprint',
      new TableColumn({
        name: 'review_comment',
        type: 'text',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'user_sprint',
      new TableColumn({
        name: 'response_reason',
        type: 'text',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'user_sprint',
      new TableColumn({
        name: 'responded_at',
        type: 'datetime',
        isNullable: true,
      }),
    );
  }

  private async ensureTaskCompatibility(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await this.addColumnIfMissing(
      queryRunner,
      'tasks',
      new TableColumn({
        name: 'carry_over_meta',
        type: 'json',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'tasks',
      new TableColumn({
        name: 'deletedBy',
        type: 'json',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'tasks',
      new TableColumn({
        name: 'deletedAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'tasks',
      new TableColumn({
        name: 'isDeleted',
        type: 'boolean',
        default: false,
      }),
    );
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ): Promise<void> {
    if (!(await queryRunner.hasColumn(tableName, column.name))) {
      await queryRunner.addColumn(tableName, column);
    }
  }

  private async addIndexIfMissing(
    queryRunner: QueryRunner,
    table: Table,
    definition: { name: string; columnNames: string[] },
  ): Promise<void> {
    const exists = table.indices.some(
      (index) =>
        index.name === definition.name ||
        this.hasSameColumns(index.columnNames, definition.columnNames),
    );

    if (!exists) {
      await queryRunner.createIndex(
        table,
        new TableIndex({
          name: definition.name,
          columnNames: definition.columnNames,
        }),
      );
    }
  }

  private hasSameColumns(left: string[], right: string[]): boolean {
    return (
      left.length === right.length &&
      [...left]
        .sort()
        .every((column, index) => column === [...right].sort()[index])
    );
  }
}
