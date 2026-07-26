import type { UserStatusType } from "../enum";

export { };

declare global {
    /**
     * Now declare things that go in the global namespace,
     * or augment existing declarations in the global namespace.
     */

    interface IBackendRes<T> {
        error?: string | string[];
        message: string;
        statusCode: number | string;
        data?: T;
    }

    interface IAccount {
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            status: UserStatusType;
            role: {
                id: string;
                name: string;
            },
            permissions: {
                id: string;
                name: string;
                apiPath: string;
                method: string;
                module: string;
            }[]
        }
    }

    interface IGetAccount extends Omit<IAccount, "access_token"> { }

    interface IUser {
        id: string;
        email: string;
        password: string;
        fullName: string;
        status: UserStatusType;
        role: {
            id: string;
            name: string;
            description?: string;
            permissions?: string[];
        } | string;
    }

}