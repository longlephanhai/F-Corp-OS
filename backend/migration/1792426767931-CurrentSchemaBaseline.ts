import { MigrationInterface, QueryRunner } from 'typeorm';

const APPLICATION_TABLES = [
  'permissions',
  'roles',
  'skills',
  'skill_evidences',
  'user_skills',
  'user_sprint',
  'tasks',
  'sprints',
  'project_managers',
  'projects',
  'users',
  'websocket',
  'chat_messages',
  'hr_review_cycles',
  'hr_review_records',
  'hr_wallets',
  'hr_transaction_histories',
  'notifications',
  'task_dependencies',
  'role_permissions',
];

export class CurrentSchemaBaseline1792426767931 implements MigrationInterface {
    name = 'CurrentSchemaBaseline1792426767931';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const existingTables: string[] = [];

        for (const tableName of APPLICATION_TABLES) {
            if (await queryRunner.hasTable(tableName)) {
                existingTables.push(tableName);
            }
        }

        if (existingTables.length === APPLICATION_TABLES.length) {
            return;
        }

        if (existingTables.length > 0) {
            const missingTables = APPLICATION_TABLES.filter(
                (tableName) => !existingTables.includes(tableName),
            );
            throw new Error(
                `Current schema baseline found a partial application schema. Missing tables: ${missingTables.join(', ')}`,
            );
        }

        await queryRunner.query(`CREATE TABLE \`permissions\` (\`id\` varchar(36) NOT NULL, \`description\` varchar(255) NOT NULL, \`api_path\` varchar(255) NOT NULL, \`method\` varchar(255) NOT NULL, \`module\` varchar(255) NOT NULL, \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`skills\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`parent_id\` varchar(255) NULL, \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`skill_evidences\` (\`id\` varchar(36) NOT NULL, \`user_skill_id\` varchar(255) NOT NULL, \`task_id\` varchar(255) NULL, \`xp_granted\` int NOT NULL DEFAULT '0', \`type\` enum ('CERTIFICATE', 'PROJECT_LINK', 'ASSESSMENT', 'WORK_HISTORY', 'TASK_COMPLETION', 'OTHER') NOT NULL DEFAULT 'PROJECT_LINK', \`title\` text NULL, \`url\` text NULL, \`description\` text NULL, \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`status\` enum ('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING', \`rejectReason\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_skills\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`skill_id\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`level\` int NOT NULL DEFAULT '1', \`current_xp\` int NOT NULL DEFAULT '0', \`years\` float NULL, \`evidenceNote\` varchar(255) NULL, \`confidenceScore\` float NULL, \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_sprint\` (\`id\` varchar(36) NOT NULL, \`sprint_id\` varchar(255) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`percitant\` float NOT NULL DEFAULT '100', \`status\` enum ('requested', 'pending_approval', 'assigned', 'declined', 'released') NOT NULL DEFAULT 'requested', \`hard_skill_rate\` int NULL, \`soft_skill_rate\` int NULL, \`review_comment\` text NULL, \`response_reason\` text NULL, \`responded_at\` datetime NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tasks\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NULL, \`sprint_id\` varchar(255) NOT NULL, \`title\` varchar(255) NULL, \`description\` text NULL, \`priority\` enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM', \`status\` enum ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE') NOT NULL DEFAULT 'TODO', \`progress\` int NOT NULL DEFAULT '0', \`requiredSkills\` json NULL, \`startDate\` date NULL, \`endDate\` date NULL, \`budgetRate\` decimal(10,2) NULL, \`carry_over_meta\` json NULL, \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sprints\` (\`id\` varchar(36) NOT NULL, \`project_id\` varchar(255) NOT NULL, \`name\` varchar(255) NULL, \`start_date\` timestamp NULL, \`end_date\` timestamp NULL, \`attendant\` json NULL, \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`status\` enum ('upcoming', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`project_managers\` (\`id\` varchar(36) NOT NULL, \`project_id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`manager_role\` enum ('PRIMARY', 'CO_MANAGER') NOT NULL DEFAULT 'CO_MANAGER', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_project_manager_user\` (\`user_id\`), INDEX \`idx_project_manager_project\` (\`project_id\`), UNIQUE INDEX \`uq_project_manager_project_user\` (\`project_id\`, \`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`projects\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, \`status\` varchar(255) NOT NULL DEFAULT 'active', \`pm_id\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`is_deleted\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(100) NOT NULL, \`password\` varchar(255) NOT NULL, \`fullName\` varchar(100) NOT NULL, \`title\` varchar(100) NULL, \`costRate\` decimal(10,2) NULL, \`managerId\` varchar(255) NULL, \`refreshToken\` text NULL, \`status\` enum ('AVAILABLE', 'IN_PROJECT', 'BENCH') NOT NULL DEFAULT 'AVAILABLE', \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`role_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`websocket\` (\`id\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chat_messages\` (\`id\` varchar(36) NOT NULL, \`project_id\` varchar(255) NOT NULL, \`sender_id\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`hr_review_cycles\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`startDate\` date NOT NULL, \`endDate\` date NOT NULL, \`status\` enum ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT', \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`hr_review_records\` (\`id\` varchar(36) NOT NULL, \`status\` enum ('PENDING', 'IN_REVIEW', 'COMPLETED') NOT NULL DEFAULT 'PENDING', \`finalScore\` decimal(5,2) NULL, \`tempScore\` decimal(5,2) NULL, \`reviewerNote\` text NULL, \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`review_cycle_id\` varchar(36) NULL, \`employee_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`hr_wallets\` (\`id\` varchar(36) NOT NULL, \`balance\` decimal(10,2) NOT NULL DEFAULT '0.00', \`status\` enum ('ACTIVE', 'LOCKED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE', \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`employee_id\` varchar(36) NULL, UNIQUE INDEX \`REL_9727b9b63806a8026dec737f06\` (\`employee_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`hr_transaction_histories\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(10,2) NOT NULL, \`type\` enum ('REWARD', 'PENALTY', 'TRANSFER') NOT NULL, \`reason\` text NOT NULL, \`referenceId\` varchar(255) NULL, \`createdBy\` json NULL, \`updatedBy\` json NULL, \`deletedBy\` json NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`wallet_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notifications\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NULL, \`title\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`type\` varchar(255) NOT NULL DEFAULT 'info', \`is_read\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`task_dependencies\` (\`id\` varchar(36) NOT NULL, \`task_id\` varchar(36) NOT NULL, \`depends_on_task_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role_permissions\` (\`role_id\` varchar(36) NOT NULL, \`permission_id\` varchar(36) NOT NULL, INDEX \`IDX_178199805b901ccd220ab7740e\` (\`role_id\`), INDEX \`IDX_17022daf3f885f7d35423e9971\` (\`permission_id\`), PRIMARY KEY (\`role_id\`, \`permission_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`skill_evidences\` ADD CONSTRAINT \`FK_ce3f797e6bd85d4beba8cc4ef3c\` FOREIGN KEY (\`user_skill_id\`) REFERENCES \`user_skills\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_skills\` ADD CONSTRAINT \`FK_6926002c360291df66bb2c5fdeb\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_skills\` ADD CONSTRAINT \`FK_eb69710b0a00f42fb95fc2ac2f5\` FOREIGN KEY (\`skill_id\`) REFERENCES \`skills\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_sprint\` ADD CONSTRAINT \`FK_0261d60b01583cd8f9ebbe3371b\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_sprint\` ADD CONSTRAINT \`FK_d1f3faea7211102fc420965abf6\` FOREIGN KEY (\`sprint_id\`) REFERENCES \`sprints\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_db55af84c226af9dce09487b61b\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_b512d5a489d692f66569978b8a7\` FOREIGN KEY (\`sprint_id\`) REFERENCES \`sprints\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sprints\` ADD CONSTRAINT \`FK_82145010051f3f2fc94671c0b35\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`project_managers\` ADD CONSTRAINT \`FK_3e77979428981f491856c6e74fc\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`project_managers\` ADD CONSTRAINT \`FK_d109f23cbeb6480e8b83186945a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`projects\` ADD CONSTRAINT \`FK_7dad0bd6e9c03325431e1e702b0\` FOREIGN KEY (\`pm_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_874662e039ab7d31a71450eb501\` FOREIGN KEY (\`managerId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`websocket\` ADD CONSTRAINT \`FK_d9bc1420b1aab0a8e0e81cf031d\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat_messages\` ADD CONSTRAINT \`FK_39fa6812ee5a01e761f70c21196\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat_messages\` ADD CONSTRAINT \`FK_9e5fc47ecb06d4d7b84633b1718\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`hr_review_records\` ADD CONSTRAINT \`FK_e43e6eea8fc9637e0103bc4d516\` FOREIGN KEY (\`review_cycle_id\`) REFERENCES \`hr_review_cycles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`hr_review_records\` ADD CONSTRAINT \`FK_ab36bc6767c01e31162adc71fec\` FOREIGN KEY (\`employee_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`hr_wallets\` ADD CONSTRAINT \`FK_9727b9b63806a8026dec737f063\` FOREIGN KEY (\`employee_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`hr_transaction_histories\` ADD CONSTRAINT \`FK_04771edcdc3efdc51422eaf6db4\` FOREIGN KEY (\`wallet_id\`) REFERENCES \`hr_wallets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_178199805b901ccd220ab7740ec\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_17022daf3f885f7d35423e9971e\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public down(): Promise<void> {
        return Promise.reject(
            new Error(
                'CurrentSchemaBaseline cannot be reverted safely because it may have been applied as a no-op to an existing schema.',
            ),
        );
    }

}
