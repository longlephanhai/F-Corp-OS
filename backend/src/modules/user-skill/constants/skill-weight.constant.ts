import { EvidenceType } from "common/enum/evidence.enum";


export const EVIDENCE_WEIGHTS: Record<EvidenceType, number> = {
    [EvidenceType.CERTIFICATE]: 0.4,
    [EvidenceType.PROJECT_LINK]: 0.3,
    [EvidenceType.ASSESSMENT]: 0.3,
    [EvidenceType.WORK_HISTORY]: 0.2,
    [EvidenceType.OTHER]: 0.1,
};

export const STATUS_FACTORS = {
    APPROVED: 1.0,
    PENDING: 0.0,
    REJECTED: 0.0,
};