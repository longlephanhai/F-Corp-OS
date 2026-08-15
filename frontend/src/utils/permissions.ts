export const ALL_PERMISSIONS = {
    USERS: {
        READ: { method: "GET", api_path: '/api/v1/users', module: "USERS" },
        CREATE: { method: "POST", api_path: '/api/v1/users', module: "USERS" },
        UPDATE: { method: "PATCH", api_path: '/api/v1/users/:id', module: "USERS" },
        DELETE: { method: "DELETE", api_path: '/api/v1/users/:id', module: "USERS" },
    },
    ROLES: {
        READ: { method: "GET", api_path: '/api/v1/roles', module: "ROLES" },
        CREATE: { method: "POST", api_path: '/api/v1/roles', module: "ROLES" },
        UPDATE: { method: "PATCH", api_path: '/api/v1/roles/:id', module: "ROLES" },
        DELETE: { method: "DELETE", api_path: '/api/v1/roles/:id', module: "ROLES" },
    },
    PERMISSIONS: {
        READ: { method: "GET", api_path: '/api/v1/permissions', module: "PERMISSIONS" },
        CREATE: { method: "POST", api_path: '/api/v1/permissions', module: "PERMISSIONS" },
        UPDATE: { method: "PATCH", api_path: '/api/v1/permissions/:id', module: "PERMISSIONS" },
        DELETE: { method: "DELETE", api_path: '/api/v1/permissions/:id', module: "PERMISSIONS" },
    },
    SKILLS: {
        READ: { method: "GET", api_path: '/api/v1/skills', module: "SKILLS" },
        CREATE: { method: "POST", api_path: '/api/v1/skills', module: "SKILLS" },
        UPDATE: { method: "PATCH", api_path: '/api/v1/skills/:id', module: "SKILLS" },
        DELETE: { method: "DELETE", api_path: '/api/v1/skills/:id', module: "SKILLS" },
    },
    USERSKILL: {
        READ: { method: "GET", api_path: '/api/v1/user-skill', module: "USERSKILL" },
        CREATE: { method: "POST", api_path: '/api/v1/user-skill', module: "USERSKILL" },
        UPDATE: { method: "PATCH", api_path: '/api/v1/user-skill/:id', module: "USERSKILL" },
        DELETE: { method: "DELETE", api_path: '/api/v1/user-skill/:id', module: "USERSKILL" },
    },
    SKILLEVIDENCES: {
        READ: { method: "GET", api_path: '/api/v1/skill-evidences', module: "SKILLEVIDENCES" },
        CREATE: { method: "POST", api_path: '/api/v1/skill-evidences', module: "SKILLEVIDENCES" },
        UPDATE: { method: "PATCH", api_path: '/api/v1/skill-evidences/:id', module: "SKILLEVIDENCES" },
        DELETE: { method: "DELETE", api_path: '/api/v1/skill-evidences/:id', module: "SKILLEVIDENCES" }
    },
    USERSPRINTS: {
        READ: { method: "GET", api_path: '/api/v1/user-sprints', module: "USERSPRINTS" },
        CREATE: { method: "POST", api_path: '/api/v1/user-sprints', module: "USERSPRINTS" },
        UPDATE: { method: "PATCH", api_path: '/api/v1/user-sprints/:id', module: "USERSPRINTS" },
        DELETE: { method: "DELETE", api_path: '/api/v1/user-sprints/:id', module: "USERSPRINTS" }
    },
    TASK: {
        READ: { method: "GET", api_path: '/api/v1/task', module: "TASK" },
        CREATE: { method: "POST", api_path: '/api/v1/task', module: "TASK" },
        UPDATE: { method: "PATCH", api_path: '/api/v1/task/:id', module: "TASK" },
        DELETE: { method: "DELETE", api_path: '/api/v1/task/:id', module: "TASK" }
    }
}