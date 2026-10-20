export interface RoutePermission {
  method: string;
  api_path: string;
}

export function normalizeRoutePath(path: string): string {
  if (path.length > 1) {
    return path.replace(/\/+$/, '');
  }

  return path;
}

export function hasRoutePermission(
  permissions: RoutePermission[],
  method: string,
  routePath: string,
): boolean {
  const targetMethod = method.toUpperCase();
  const targetPath = normalizeRoutePath(routePath);

  return permissions.some(
    (permission) =>
      permission.method.toUpperCase() === targetMethod &&
      normalizeRoutePath(permission.api_path) === targetPath,
  );
}
