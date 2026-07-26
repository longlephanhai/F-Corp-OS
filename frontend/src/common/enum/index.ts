const UserStatusType = {
    AVAILABLE: 'AVAILABLE',
    IN_PROJECT: 'IN_PROJECT',
} as const;

export type UserStatusType = typeof UserStatusType[keyof typeof UserStatusType];