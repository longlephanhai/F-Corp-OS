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