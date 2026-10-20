export const ADMIN_ROLE = 'ADMIN';
export const HR_ROLE = 'HR';
export const PM_ROLE = 'PM';
export const DEVELOPER_ROLE = 'DEVELOPER';

export const CORE_ROLES = [
  ADMIN_ROLE,
  HR_ROLE,
  PM_ROLE,
  DEVELOPER_ROLE,
] as const;

export type CoreRole = (typeof CORE_ROLES)[number];

export interface PermissionDefinition {
  description: string;
  apiPath: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  module: string;
  roles: CoreRole[];
}

const permission = (
  method: PermissionDefinition['method'],
  apiPath: string,
  module: string,
  description: string,
  roles: CoreRole[] = [],
): PermissionDefinition => ({ method, apiPath, module, description, roles });

const HR_ACCESS: CoreRole[] = [HR_ROLE];
const PM_ACCESS: CoreRole[] = [PM_ROLE];
const DEVELOPER_ACCESS: CoreRole[] = [DEVELOPER_ROLE];
const EMPLOYEE_SELF_SERVICE: CoreRole[] = [
  HR_ROLE,
  PM_ROLE,
  DEVELOPER_ROLE,
];
const PROJECT_CHAT_ACCESS: CoreRole[] = [PM_ROLE, DEVELOPER_ROLE];

/**
 * Paths use the full route templates exposed through Nest's global prefix and
 * URI versioning. Parameter names must match the controller decorators because
 * JwtAuthGuard compares Express route templates. ADMIN receives every entry.
 */
export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  permission('GET', '/api/v1/users', 'USERS', 'List users', HR_ACCESS),
  permission('GET', '/api/v1/users/count', 'USERS', 'Count users'),
  permission('GET', '/api/v1/users/count-disable-account', 'USERS', 'Count disabled users'),
  permission('GET', '/api/v1/users/:id', 'USERS', 'Get user', HR_ACCESS),
  permission('POST', '/api/v1/users', 'USERS', 'Create user'),
  permission('PATCH', '/api/v1/users/:id', 'USERS', 'Update user'),
  permission('DELETE', '/api/v1/users/:id', 'USERS', 'Delete user'),
  permission('PATCH', '/api/v1/users/:id/restore', 'USERS', 'Restore user'),
  permission('GET', '/api/v1/users/pm/my-team', 'USERS', 'View managed team', PM_ACCESS),

  permission('GET', '/api/v1/roles', 'ROLES', 'List roles', HR_ACCESS),
  permission('GET', '/api/v1/roles/count', 'ROLES', 'Count roles'),
  permission('GET', '/api/v1/roles/:id', 'ROLES', 'Get role'),
  permission('POST', '/api/v1/roles', 'ROLES', 'Create role'),
  permission('PATCH', '/api/v1/roles/:id', 'ROLES', 'Update role'),
  permission('DELETE', '/api/v1/roles/:id', 'ROLES', 'Delete role'),
  permission('GET', '/api/v1/permissions', 'PERMISSIONS', 'List permissions'),
  permission('GET', '/api/v1/permissions/count', 'PERMISSIONS', 'Count permissions'),
  permission('GET', '/api/v1/permissions/:id', 'PERMISSIONS', 'Get permission'),
  permission('POST', '/api/v1/permissions', 'PERMISSIONS', 'Create permission'),
  permission('PATCH', '/api/v1/permissions/:id', 'PERMISSIONS', 'Update permission'),
  permission('DELETE', '/api/v1/permissions/:id', 'PERMISSIONS', 'Delete permission'),

  permission('GET', '/api/v1/skills', 'SKILLS', 'List skills', EMPLOYEE_SELF_SERVICE),
  permission('GET', '/api/v1/skills/all', 'SKILLS', 'List all skills', EMPLOYEE_SELF_SERVICE),
  permission('GET', '/api/v1/skills/:id', 'SKILLS', 'Get skill', EMPLOYEE_SELF_SERVICE),
  permission('POST', '/api/v1/skills', 'SKILLS', 'Create skill', DEVELOPER_ACCESS),
  permission('PATCH', '/api/v1/skills/:id', 'SKILLS', 'Update skill'),
  permission('DELETE', '/api/v1/skills/:id', 'SKILLS', 'Delete skill'),
  permission('POST', '/api/v1/user-skill', 'USER_SKILL', 'Create own user skill', DEVELOPER_ACCESS),
  permission('GET', '/api/v1/user-skill/skill-tree', 'USER_SKILL', 'View own skill tree', DEVELOPER_ACCESS),
  permission('GET', '/api/v1/user-skill', 'USER_SKILL', 'List own user skills', DEVELOPER_ACCESS),
  permission('GET', '/api/v1/user-skill/:id', 'USER_SKILL', 'Get own user skill', DEVELOPER_ACCESS),
  permission('PATCH', '/api/v1/user-skill/:id', 'USER_SKILL', 'Update own user skill', DEVELOPER_ACCESS),
  permission('DELETE', '/api/v1/user-skill/:id', 'USER_SKILL', 'Delete own user skill', DEVELOPER_ACCESS),
  permission('POST', '/api/v1/skill-evidences', 'SKILL_EVIDENCE', 'Submit skill evidence', DEVELOPER_ACCESS),
  permission('PATCH', '/api/v1/skill-evidences/:id/verify', 'SKILL_EVIDENCE', 'Verify managed developer evidence', PM_ACCESS),

  permission('POST', '/api/v1/projects', 'PROJECTS', 'Create project', PM_ACCESS),
  permission('GET', '/api/v1/projects/my-projects', 'PROJECTS', 'List managed projects', PM_ACCESS),
  permission('GET', '/api/v1/projects/:projectId/manager-candidates', 'PROJECTS', 'List project manager candidates', PM_ACCESS),
  permission('GET', '/api/v1/projects/:projectId/managers', 'PROJECTS', 'List project managers', PM_ACCESS),
  permission('POST', '/api/v1/projects/:projectId/managers', 'PROJECTS', 'Assign project manager', PM_ACCESS),
  permission('DELETE', '/api/v1/projects/:projectId/managers/:userId', 'PROJECTS', 'Remove project manager', PM_ACCESS),
  permission('GET', '/api/v1/projects/:id', 'PROJECTS', 'Get managed project', PM_ACCESS),

  permission('POST', '/api/v1/sprints', 'SPRINTS', 'Create sprint', PM_ACCESS),
  permission('GET', '/api/v1/sprints/project/:projectId', 'SPRINTS', 'List project sprints', PM_ACCESS),
  permission('GET', '/api/v1/sprints/project/:projectId/retrospective-trends', 'SPRINTS', 'View sprint retrospective trends', PM_ACCESS),
  permission('GET', '/api/v1/sprints/:id/readiness', 'SPRINTS', 'View sprint readiness', PM_ACCESS),
  permission('GET', '/api/v1/sprints/:id/completion-readiness', 'SPRINTS', 'View sprint completion readiness', PM_ACCESS),
  permission('GET', '/api/v1/sprints/:id/retrospective', 'SPRINTS', 'View sprint retrospective', PM_ACCESS),
  permission('GET', '/api/v1/sprints/:id/planning-forecast', 'SPRINTS', 'View sprint planning forecast', PM_ACCESS),
  permission('PATCH', '/api/v1/sprints/:id/status', 'SPRINTS', 'Update sprint status', PM_ACCESS),
  permission('PATCH', '/api/v1/sprints/:id', 'SPRINTS', 'Update sprint', PM_ACCESS),
  permission('DELETE', '/api/v1/sprints/:id', 'SPRINTS', 'Delete sprint', PM_ACCESS),
  permission('GET', '/api/v1/sprints/:id', 'SPRINTS', 'Get sprint', PM_ACCESS),

  permission('GET', '/api/v1/tasks/sprint/:sprintId', 'TASKS', 'List sprint tasks', PM_ACCESS),
  permission('GET', '/api/v1/tasks/:taskId/candidates', 'TASKS', 'List task candidates', PM_ACCESS),
  permission('GET', '/api/v1/tasks/:taskId/carry-over-history', 'TASKS', 'View task carry-over history', PM_ACCESS),
  permission('POST', '/api/v1/tasks', 'TASKS', 'Create task', PM_ACCESS),
  permission('PATCH', '/api/v1/tasks/:taskId/assignee', 'TASKS', 'Assign task', PM_ACCESS),
  permission('PATCH', '/api/v1/tasks/:taskId/timeline', 'TASKS', 'Update task timeline', PM_ACCESS),
  permission('PATCH', '/api/v1/tasks/:taskId/lifecycle', 'TASKS', 'Update task lifecycle', PM_ACCESS),
  permission('POST', '/api/v1/tasks/:taskId/carry-over', 'TASKS', 'Carry over task', PM_ACCESS),
  permission('PATCH', '/api/v1/tasks/:taskId', 'TASKS', 'Update task', PM_ACCESS),
  permission('DELETE', '/api/v1/tasks/:taskId', 'TASKS', 'Delete task', PM_ACCESS),
  permission('GET', '/api/v1/tasks/:taskId/dependencies', 'TASK_DEPENDENCIES', 'List task dependencies', PM_ACCESS),
  permission('GET', '/api/v1/tasks/:taskId/dependencies/status', 'TASK_DEPENDENCIES', 'View task dependency status', PM_ACCESS),
  permission('POST', '/api/v1/tasks/:taskId/dependencies', 'TASK_DEPENDENCIES', 'Create task dependency', PM_ACCESS),
  permission('DELETE', '/api/v1/tasks/:taskId/dependencies/:dependencyId', 'TASK_DEPENDENCIES', 'Delete task dependency', PM_ACCESS),

  permission('GET', '/api/v1/user-sprint/sprint/:sprintId', 'USER_SPRINT', 'List sprint allocations', PM_ACCESS),
  permission('GET', '/api/v1/user-sprint/capacity/:userId', 'USER_SPRINT', 'View developer capacity', PM_ACCESS),
  permission('GET', '/api/v1/user-sprint/resource-planner', 'USER_SPRINT', 'View resource planner', PM_ACCESS),
  permission('GET', '/api/v1/user-sprint/my-invitations', 'USER_SPRINT', 'View own sprint invitations', DEVELOPER_ACCESS),
  permission('PATCH', '/api/v1/user-sprint/:id/respond', 'USER_SPRINT', 'Respond to sprint invitation', DEVELOPER_ACCESS),
  permission('POST', '/api/v1/user-sprint', 'USER_SPRINT', 'Create sprint allocation', PM_ACCESS),
  permission('PATCH', '/api/v1/user-sprint/:id/submit-approval', 'USER_SPRINT', 'Submit allocation approval', PM_ACCESS),
  permission('DELETE', '/api/v1/user-sprint/:id/request', 'USER_SPRINT', 'Cancel allocation request', PM_ACCESS),
  permission('PATCH', '/api/v1/user-sprint/:id/retry-invitation', 'USER_SPRINT', 'Retry sprint invitation', PM_ACCESS),
  permission('PATCH', '/api/v1/user-sprint/:id', 'USER_SPRINT', 'Update sprint allocation', PM_ACCESS),
  permission('PATCH', '/api/v1/user-sprint/:id/release', 'USER_SPRINT', 'Release sprint allocation', PM_ACCESS),
  permission('GET', '/api/v1/user-sprint/user', 'USER_SPRINT', 'View own project allocations', DEVELOPER_ACCESS),
  permission('GET', '/api/v1/pm-action-center', 'PM_ACTION_CENTER', 'View PM action center', PM_ACCESS),

  permission('GET', '/api/v1/notifications', 'NOTIFICATIONS', 'View own notifications', EMPLOYEE_SELF_SERVICE),
  permission('PATCH', '/api/v1/notifications/read-all', 'NOTIFICATIONS', 'Mark own notifications read', EMPLOYEE_SELF_SERVICE),
  permission('PATCH', '/api/v1/notifications/:id/read', 'NOTIFICATIONS', 'Mark own notification read', EMPLOYEE_SELF_SERVICE),
  permission('GET', '/api/v1/chat/projects/:projectId/members', 'CHAT', 'View project chat members', PROJECT_CHAT_ACCESS),
  permission('GET', '/api/v1/chat/projects/:projectId/messages', 'CHAT', 'View project chat messages', PROJECT_CHAT_ACCESS),
  permission('POST', '/api/v1/chat/messages', 'CHAT', 'Send project chat message', PROJECT_CHAT_ACCESS),

  permission('GET', '/api/v1/hr-talents', 'HR_TALENT', 'View talent directory', HR_ACCESS),
  permission('GET', '/api/v1/hr-talents/:employeeId', 'HR_TALENT', 'View talent profile', HR_ACCESS),
  permission('GET', '/api/v1/hr-talents/bench', 'HR_TALENT', 'View bench talent', HR_ACCESS),
  permission('GET', '/api/v1/hr-talents/bench/readiness', 'HR_TALENT', 'View bench readiness', HR_ACCESS),
  permission('GET', '/api/v1/hr-talents/analytics/skill-supply-summary', 'HR_TALENT', 'View skill supply summary', HR_ACCESS),
  permission('GET', '/api/v1/hr-talents/analytics/data-quality', 'HR_TALENT', 'View talent data quality', HR_ACCESS),
  permission('GET', '/api/v1/hr-talents/analytics/skill-matrix', 'HR_TALENT', 'View skill matrix', HR_ACCESS),
  permission('GET', '/api/v1/hr-talents/analytics/skills/:skillId/employees', 'HR_TALENT', 'View employees by skill', HR_ACCESS),

  permission('POST', '/api/v1/hr-reviews/cycles', 'HR_REVIEW', 'Create review cycle', HR_ACCESS),
  permission('GET', '/api/v1/hr-reviews/records/stats', 'HR_REVIEW', 'View review statistics', HR_ACCESS),
  permission('GET', '/api/v1/hr-reviews/records', 'HR_REVIEW', 'List review records', HR_ACCESS),
  permission('GET', '/api/v1/hr-reviews/records/:id', 'HR_REVIEW', 'View review record', HR_ACCESS),
  permission('PATCH', '/api/v1/hr-reviews/records/:id/status', 'HR_REVIEW', 'Update review status', HR_ACCESS),
  permission('PATCH', '/api/v1/hr-reviews/records/:id/score', 'HR_REVIEW', 'Update review score', HR_ACCESS),

  permission('POST', '/api/v1/hr-wallets/transaction', 'HR_WALLET', 'Create wallet transaction', HR_ACCESS),
  permission('GET', '/api/v1/hr-wallets', 'HR_WALLET', 'List employee wallets', HR_ACCESS),
  permission('GET', '/api/v1/hr-wallets/transactions', 'HR_WALLET', 'List administrative wallet transactions', HR_ACCESS),
  permission('GET', '/api/v1/hr-wallets/my-wallet', 'HR_WALLET', 'View own wallet', EMPLOYEE_SELF_SERVICE),
  permission('GET', '/api/v1/hr-wallets/my-transactions', 'HR_WALLET', 'View own wallet transactions', EMPLOYEE_SELF_SERVICE),
];
