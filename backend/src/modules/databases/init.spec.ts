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
});
