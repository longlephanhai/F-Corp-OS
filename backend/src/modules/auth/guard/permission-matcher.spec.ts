import { hasRoutePermission } from './permission-matcher';

describe('hasRoutePermission', () => {
  const permissions = [
    { method: 'GET', api_path: '/api/v1/hr-talents' },
    { method: 'GET', api_path: '/api/v1/hr-talents/:employeeId' },
    { method: 'PATCH', api_path: '/api/v1/hr-reviews/records/:id/status' },
    { method: 'PATCH', api_path: '/api/v1/skill-evidences/:id/verify' },
  ];

  it('matches a static route by method and full path', () => {
    expect(
      hasRoutePermission(permissions, 'GET', '/api/v1/hr-talents'),
    ).toBe(true);
  });

  it('matches parameterized Express route templates exactly', () => {
    expect(
      hasRoutePermission(
        permissions,
        'PATCH',
        '/api/v1/hr-reviews/records/:id/status',
      ),
    ).toBe(true);
    expect(
      hasRoutePermission(
        permissions,
        'PATCH',
        '/api/v1/skill-evidences/:id/verify',
      ),
    ).toBe(true);
  });

  it('does not treat concrete URLs or another method as route templates', () => {
    expect(
      hasRoutePermission(
        permissions,
        'GET',
        '/api/v1/hr-talents/9f943ad8-e6a6-46c2-9d0c-25614fce2793',
      ),
    ).toBe(false);
    expect(
      hasRoutePermission(
        permissions,
        'GET',
        '/api/v1/hr-reviews/records/:id/status',
      ),
    ).toBe(false);
  });
});
