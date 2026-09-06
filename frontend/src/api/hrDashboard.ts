import axios from '../config/interceptor';

export interface HrDashboardSummary {
    workforce: {
        totalEmployees: number;
        inProject: number;
        available: number;
        bench: number;
        benchRate: number;
    };

    reviews: {
        total: number;
        pending: number;
        inReview: number;
        completed: number;
        completionRate: number;
    };

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
            totalEmployees: number;
            benchEmployees: number;
        }>;
    };

    benchReadiness: {
        totalBench: number;
        ready: number;
        partiallyReady: number;
        needsVerification: number;
        needsProfileUpdate: number;
    };

    dataQuality: {
        employeesWithoutSkills: number;
        employeesWithoutApprovedEvidence: number;
        employeesWithPendingEvidence: number;
        totalPendingEvidences: number;
        staleProfiles: number;
    };

    wallet: {
        totalWallets: number;
        totalBalance: number;
        rewardTransactions: number;
        penaltyTransactions: number;
    };
}

export const hrDashboardApi = {
    getSummary: () =>
        axios.get<IBackendRes<HrDashboardSummary>>(
            '/hr-dashboard/summary',
        ),
};