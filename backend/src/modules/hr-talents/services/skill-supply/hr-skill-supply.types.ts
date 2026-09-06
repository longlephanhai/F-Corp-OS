export interface HrSkillSupplySnapshot {
  skillId: string;

  name: string;

  description: string | null;

  totalEmployees: number;

  level3Plus: number;

  level4Plus: number;

  verifiedEmployees: number;

  verificationRate: number;

  evidence: {
    approved: number;

    pending: number;
  };

  workforce: {
    available: number;

    inProject: number;

    bench: number;
  };
}

export interface HrSkillSupplyPage {
  meta: {
    currentPage: number;

    pageSize: number;

    pages: number;

    total: number;
  };

  result: HrSkillSupplySnapshot[];
}