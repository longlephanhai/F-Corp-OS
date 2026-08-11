import axios from "../config/interceptor";

export const callApiLogin = async (data: { email: string, password: string }): Promise<IBackendRes<IAccount>> => {
    return await axios.post('/auth/login', data);
}

export const callFetchAccount = async (): Promise<IBackendRes<IGetAccount>> => {
    return await axios.get('/auth/account');
}

//=================API Admin-User====================
export const callFetchUsers = (query: string) => {
    return axios.get(`/users?${query}`);
}

export const callFetchRoles = () => {
    return axios.get('/roles');
}