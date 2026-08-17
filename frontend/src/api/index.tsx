import axios from "../config/interceptor";

export const callApiLogin = async (data: { email: string, password: string }): Promise<IBackendRes<IAccount>> => {
    return await axios.post('/auth/login', data);
}

export const callFetchAccount = async (): Promise<IBackendRes<IGetAccount>> => {
    return await axios.get('/auth/account');
}
//=============================== Users ==========================================
export const callCountUsers = () => {
    return axios.get('/users/count');
}

export const callCountRoles = () => {
    return axios.get('/roles/count');
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