import { UserStatusType } from "common/enum/user.enum";

export interface IUser {

    id: string;
    email: string;
    password: string;
    fullName: string;

    role: {
        id: string;
        name: string;
        description: string;
        permissions?: {
            id: number;
            name: string;
            description: string;
            apiPath: string;
            method: string;
            module: string;
        }
    }

    // allocation  1-n

    status: UserStatusType;
}

