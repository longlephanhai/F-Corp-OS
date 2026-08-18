const UserStatusType = {
    AVAILABLE: 'AVAILABLE',
    IN_PROJECT: 'IN_PROJECT',
} as const;

export type UserStatusType = typeof UserStatusType[keyof typeof UserStatusType];

const EvidenceType = {
    CERTIFICATE: 'CERTIFICATE',
    PROJECT_LINK: 'PROJECT_LINK',
    ASSESSMENT: 'ASSESSMENT',
    WORK_HISTORY: 'WORK_HISTORY',
    OTHER: 'OTHER',
} as const;

export type EvidenceType = typeof EvidenceType[keyof typeof EvidenceType];

const StatusEvidenceType = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const;

export type StatusEvidenceType = typeof StatusEvidenceType[keyof typeof StatusEvidenceType];