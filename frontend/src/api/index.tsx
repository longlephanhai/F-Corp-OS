import axios from "../config/interceptor";

export const callApiLogin = async (data: { email: string, password: string }): Promise<IBackendRes<IAccount>> => {
    return await axios.post('/auth/login', data);
}

export const callFetchAccount = async (): Promise<IBackendRes<IGetAccount>> => {
    return await axios.get('/auth/account');
}
//=============================== ADMIN-DASHBOARD ==========================================
export const callCountUsers = () => {
    return axios.get('/users/count');
}

export const callCountRoles = () => {
    return axios.get('/roles/count');
}

export const callCountDisableAccount = () => {
    return axios.get('/users/count-disable-account');
}

export const callCountPermissions = () => {
    return axios.get('/permissions/count');
}
//=================API Admin-User====================
export const callFetchUsers = (query: string) => {
    return axios.get(`/users?${query}`);
}

export const callCreateUser = (data: {
    email: string;
    password: string;
    fullName: string;
    role_id: string;
    title: string;
    status?: string;
}) => {
    return axios.post('/users', data);
}

export const callDeleteUser = (id: String) => {
    return axios.delete(`/users/${id}`);
}

export const callRestoreUser = (id: string) => {
    return axios.patch(`/users/${id}/restore`);
}

export const callUpdateUser = (id: string, data: {
    email: string;
    fullName: string;
    role_id: string;
    title: string;
    status: string;
}) => {
    return axios.patch(`/users/${id}`, data);
}

//==================API Admin-Role====================
export const callFetchRoles = () => {
    return axios.get('/roles');
}


// API SKILLS
export const callFetchSkills = async (query: string): Promise<IBackendRes<IModelPaginate<ISkills>>> => {
    return await axios.get(`/skills?${query}`);
}

export const callFetchSkillsWithoutPaginate = async (): Promise<IBackendRes<IModelPaginate<ISkills>>> => {
    return await axios.get(`/skills/all`);
}

export const callCreateSkill = async (data: { name: string; description: string }): Promise<IBackendRes<ISkills>> => {
    return await axios.post('/skills', data);
}

//API USER-SKILL
export const callCreateUserSkill = async (skillId: string, description: string, years: number, evidences: IEviencesDTO[]): Promise<IBackendRes<IUserSkill>> => {
    return await axios.post('/user-skill', {
        skillId,
        description,
        years,
        evidences
    });
}

export const callCreateRole = (data: {
    name: string;
    description: string;
    permissions: string[];
}) => {
    return axios.post('/roles', data);
}

export const callFetchRoleById = (id: string) => {
    return axios.get(`/roles/${id}`);
}

export const callUpdateRole = (id: string, data: {
    name: string;
    description: string;
    permissions: string[];
}) => {
    return axios.patch(`/roles/${id}`, data);
}

export const callDeleteRole = (id: string) => {
    return axios.delete(`/roles/${id}`);
}

//==================API Admin-Permission====================
export const callFetchPermissions = () => {
    return axios.get('/permissions');
}

export const callCreatePermission = (data: {
    description: string;
    api_path: string;
    method: string;
    module: string;
}) => {
    return axios.post('/permissions', data);
}

export const callUpdatePermission = (id: string, data: {
    description?: string;
    api_path?: string;
    method?: string;
    module?: string;
}) => {
    return axios.patch(`/permissions/${id}`, data);
}

export const callDeletePermission = (id: string) => {
    return axios.delete(`/permissions/${id}`);
}

