export interface HrDashboardWorkforceSummary {
    totalEmployees: number;
    inProject: number;
    available: number;
    bench: number;
    benchRate: number;
}

export interface HrDashboardReviewSummary {
    total: number;
    pending: number;
    inReview: number;
    completed: number;
    completionRate: number;
}

export interface HrDashboardBenchReadinessSummary {
    totalBench: number;
    ready: number;
    partiallyReady: number;
    needsVerification: number;
    needsProfileUpdate: number;
}

export interface HrDashboardDataQualitySummary {
    employeesWithoutSkills: number;
    employeesWithoutApprovedEvidence: number;
    employeesWithPendingEvidence: number;
    totalPendingEvidences: number;
    staleProfiles: number;
}

export interface HrDashboardWalletSummary {
    totalWallets: number;
    totalBalance: number;
    rewardTransactions: number;
    penaltyTransactions: number;
}

export interface HrDashboardSummary {
    workforce: HrDashboardWorkforceSummary;

    reviews: HrDashboardReviewSummary;

    skillSupply: {
        totalSkills: number;
        skillsWithSupply: number;
        zeroSupplySkills: number;
        verificationRate: number;

        topSupplySkills: Array<{
            skillId: string;
            name: string;
            totalEmployees: number;
            level4Plus: number;
        }>;

        topBenchSkills: Array<{
            skillId: string;
            name: string;
            benchEmployees: number;
            totalEmployees: number;
        }>;
    };

    benchReadiness:
    HrDashboardBenchReadinessSummary;

    dataQuality:
    HrDashboardDataQualitySummary;

    wallet:
    HrDashboardWalletSummary;
}