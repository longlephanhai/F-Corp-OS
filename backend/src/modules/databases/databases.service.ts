import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getHashPassword } from 'helper';
import { Permission } from 'modules/permissions/entities/permission.entity';
import { Role } from 'modules/roles/entities/role.entity';
import { User } from 'modules/users/entities/user.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  ADMIN_ROLE,
  CORE_ROLES,
  CoreRole,
  DEVELOPER_ROLE,
  HR_ROLE,
  PERMISSION_DEFINITIONS,
  PM_ROLE,
  PermissionDefinition,
} from './init';

const ROLE_DESCRIPTIONS: Record<CoreRole, string> = {
  ADMIN: 'System administration access',
  HR: 'HR talent, review, and wallet administration',
  PM: 'Project and sprint management access',
  DEVELOPER: 'Developer self-service access',
};

const DEMO_USERS: Array<{
  email: string;
  fullName: string;
  roleName: CoreRole;
}> = [
  { email: 'admin@gmail.com', fullName: 'Admin', roleName: ADMIN_ROLE },
  { email: 'hr@gmail.com', fullName: 'HR', roleName: HR_ROLE },
  { email: 'pm@gmail.com', fullName: 'PM', roleName: PM_ROLE },
  {
    email: 'developer@gmail.com',
    fullName: 'Developer',
    roleName: DEVELOPER_ROLE,
  },
];

@Injectable()
export class DatabasesService implements OnModuleInit {
  private readonly logger = new Logger(DatabasesService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const isInit = this.configService.get<boolean>('INIT_DATABASE', false);

    if (!isInit) {
      return;
    }

    this.assertPermissionDefinitionsAreUnique();

    await this.dataSource.transaction(async (manager) => {
      const permissions = await this.upsertPermissions(manager);
      const roles = await this.upsertRoles(manager, permissions);
      await this.createMissingDemoUsers(manager, roles);
    });

    this.logger.log('Database roles and permissions initialized.');
  }

  private async upsertPermissions(
    manager: EntityManager,
  ): Promise<Map<string, Permission>> {
    const repository = manager.getRepository(Permission);
    const existingPermissions = await repository.find({ withDeleted: true });
    const permissionByKey = new Map<string, Permission>();

    for (const existing of existingPermissions) {
      const key = this.permissionKey(existing.method, existing.api_path);

      if (!permissionByKey.has(key)) {
        permissionByKey.set(key, existing);
      }
    }

    for (const definition of PERMISSION_DEFINITIONS) {
      const key = this.permissionKey(definition.method, definition.apiPath);
      const existing = permissionByKey.get(key);

      const permission = existing ?? repository.create();
      permission.description = definition.description;
      permission.api_path = definition.apiPath;
      permission.method = definition.method;
      permission.module = definition.module;
      permission.isDeleted = false;
      permission.deletedAt = null as unknown as Date;
      permission.deletedBy = null as unknown as { id: string; email: string };

      const savedPermission = await repository.save(permission);
      permissionByKey.set(key, savedPermission);
    }

    return permissionByKey;
  }

  private async upsertRoles(
    manager: EntityManager,
    permissionByKey: Map<string, Permission>,
  ): Promise<Map<CoreRole, Role>> {
    const repository = manager.getRepository(Role);
    const roleByName = new Map<CoreRole, Role>();

    for (const roleName of CORE_ROLES) {
      let role = await repository.findOne({
        where: { name: roleName },
        relations: { permissions: true },
        withDeleted: true,
      });

      if (!role) {
        role = repository.create({ name: roleName });
      }

      role.description = ROLE_DESCRIPTIONS[roleName];
      role.isDeleted = false;
      role.deletedAt = null as unknown as Date;
      role.deletedBy = null as unknown as { id: string; email: string };
      role.permissions = this.permissionsForRole(roleName, permissionByKey);

      roleByName.set(roleName, await repository.save(role));
    }

    return roleByName;
  }

  private async createMissingDemoUsers(
    manager: EntityManager,
    roleByName: Map<CoreRole, Role>,
  ): Promise<void> {
    const initPassword = this.configService.get<string>('INIT_PASSWORD', '');

    if (!initPassword) {
      this.logger.warn(
        'INIT_PASSWORD is empty; demo users were not created. Roles and permissions were still initialized.',
      );
      return;
    }

    const repository = manager.getRepository(User);
    const password = getHashPassword(initPassword);

    for (const definition of DEMO_USERS) {
      const existing = await repository.findOne({
        where: { email: definition.email },
        withDeleted: true,
      });

      if (existing) {
        continue;
      }

      await repository.save(
        repository.create({
          email: definition.email,
          password,
          fullName: definition.fullName,
          role: roleByName.get(definition.roleName),
        }),
      );
    }
  }

  private permissionsForRole(
    roleName: CoreRole,
    permissionByKey: Map<string, Permission>,
  ): Permission[] {
    return PERMISSION_DEFINITIONS.filter(
      (definition) =>
        roleName === ADMIN_ROLE || definition.roles.includes(roleName),
    ).map((definition) => {
      const permission = permissionByKey.get(
        this.permissionKey(definition.method, definition.apiPath),
      );

      if (!permission) {
        throw new Error(
          `Permission was not initialized: ${definition.method} ${definition.apiPath}`,
        );
      }

      return permission;
    });
  }

  private assertPermissionDefinitionsAreUnique(): void {
    const definitionsByKey = new Map<string, PermissionDefinition>();

    for (const definition of PERMISSION_DEFINITIONS) {
      const key = this.permissionKey(definition.method, definition.apiPath);

      if (definitionsByKey.has(key)) {
        throw new Error(`Duplicate permission definition: ${key}`);
      }

      definitionsByKey.set(key, definition);
    }
  }

  private permissionKey(method: string, apiPath: string): string {
    return `${method.toUpperCase()} ${apiPath}`;
  }
}
