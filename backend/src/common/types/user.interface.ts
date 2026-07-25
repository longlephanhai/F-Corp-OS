import { UserStatusType } from "common/enum/user.enum";

export interface IUser {

    id: string;
    email: string;
    password: string;
    fullName: string;
    
    // role_id n-1
    role: string;

    // allocation  1-n
    status: UserStatusType;

}