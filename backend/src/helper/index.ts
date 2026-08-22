import { genSaltSync, hashSync } from "bcryptjs";

export const getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
}

export const generatedRoomUserId = (userId: string) => {
    return `userId-${userId}`;
}