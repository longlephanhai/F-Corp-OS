import {
  CoreRole,
  DEVELOPER_ROLE,
  HR_ROLE,
  PERMISSION_DEFINITIONS,
  PM_ROLE,
} from './init';

const permissionKey = (method: string, apiPath: string) =>
  `${method} ${apiPath}`;

const permissionsFor = (role: CoreRole) =>
  new Set(
    PERMISSION_DEFINITIONS.filter((definition) =>
      definition.roles.includes(role),
    ).map((definition) => permissionKey(definition.method, definition.apiPath)),
  );

describe('permission initialization catalog', () => {
  it('contains no duplicate method and path pairs', () => {
    const keys = PERMISSION_DEFINITIONS.map((definition) =>
      permissionKey(definition.method, definition.apiPath),
    );

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('assigns HR talent, review, and wallet administration to HR', () => {
    const permissions = permissionsFor(HR_ROLE);

    expect(permissions).toContain('GET /api/v1/hr-talents');
    expect(permissions).toContain('GET /api/v1/hr-reviews/records');
    expect(permissions).toContain('POST /api/v1/hr-wallets/transaction');
  });

  it('assigns evidence verification to PM without HR administration', () => {
    const permissions = permissionsFor(PM_ROLE);

    expect(permissions).toContain(
      'PATCH /api/v1/skill-evidences/:id/verify',
    );
    expect(permissions).not.toContain('GET /api/v1/hr-talents');
    expect(permissions).not.toContain('GET /api/v1/hr-reviews/records');
    expect(permissions).not.toContain('GET /api/v1/hr-wallets');
  });

  it('keeps developer wallet self-service without HR administration', () => {
    const permissions = permissionsFor(DEVELOPER_ROLE);

    expect(permissions).toContain('GET /api/v1/hr-wallets/my-wallet');
    expect(permissions).toContain('GET /api/v1/hr-wallets/my-transactions');
    expect(permissions).not.toContain('GET /api/v1/hr-wallets');
    expect(permissions).not.toContain('GET /api/v1/hr-reviews/records');
  });

  it('limits HR user access to lookup routes without Admin mutations', () => {
    const permissions = permissionsFor(HR_ROLE);

    expect(permissions).toContain('GET /api/v1/users');
    expect(permissions).toContain('GET /api/v1/users/:id');
    expect(permissions).not.toContain('POST /api/v1/users');
    expect(permissions).not.toContain('PATCH /api/v1/users/:id');
    expect(permissions).not.toContain('DELETE /api/v1/users/:id');
    expect(permissions).not.toContain('POST /api/v1/projects');
    expect(permissions).not.toContain('POST /api/v1/sprints');
  });

  it('gives PM only the managed-team, project, and sprint routes in scope', () => {
    const permissions = permissionsFor(PM_ROLE);

    expect(permissions).toContain('GET /api/v1/users/pm/my-team');
    expect(permissions).toContain('POST /api/v1/projects');
    expect(permissions).toContain('GET /api/v1/projects/my-projects');
    expect(permissions).toContain('POST /api/v1/sprints');
    expect(permissions).toContain('PATCH /api/v1/sprints/:id');
    expect(permissions).not.toContain('GET /api/v1/users');
    expect(permissions).not.toContain('POST /api/v1/users');
    expect(permissions).not.toContain('POST /api/v1/hr-reviews/cycles');
    expect(permissions).not.toContain('POST /api/v1/hr-wallets/transaction');
  });

  it('keeps UserSkill CRUD as Developer self-service only', () => {
    const developerPermissions = permissionsFor(DEVELOPER_ROLE);
    const hrPermissions = permissionsFor(HR_ROLE);
    const pmPermissions = permissionsFor(PM_ROLE);

    for (const permission of [
      'POST /api/v1/user-skill',
      'GET /api/v1/user-skill/skill-tree',
      'GET /api/v1/user-skill',
      'GET /api/v1/user-skill/:id',
      'PATCH /api/v1/user-skill/:id',
      'DELETE /api/v1/user-skill/:id',
    ]) {
      expect(developerPermissions).toContain(permission);
      expect(hrPermissions).not.toContain(permission);
      expect(pmPermissions).not.toContain(permission);
    }

    expect(developerPermissions).not.toContain('POST /api/v1/users');
    expect(developerPermissions).not.toContain('POST /api/v1/projects');
    expect(developerPermissions).not.toContain('POST /api/v1/sprints');
  });
});
