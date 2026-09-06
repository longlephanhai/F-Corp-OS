import axios from '../../config/interceptor';

import type {
  EmployeeTalentProfile,
  GetHrTalentsParams,
  TalentDirectoryResponse,
} from './talent.types';

import type {
  GetHrSkillEmployeesParams,
  GetHrSkillMatrixParams,
  GetHrSkillSupplyRiskParams,
  GetHrTalentDataQualityParams,
  HrSkillEmployeesResponse,
  HrSkillMatrixResponse,
  HrSkillSupplyRiskResponse,
  HrSkillSupplySummary,
  HrTalentDataQualityResponse,
} from './analytics.types';

import type {
  GetHrBenchReadinessParams,
  GetHrBenchTalentsParams,
  HrBenchReadinessApiResponse,
  HrBenchTalentsResponse,
} from './bench.types';

export const hrTalentsApi = {
  getAll: (
    params?: GetHrTalentsParams,
  ): Promise<
    IBackendRes<TalentDirectoryResponse>
  > => {
    return axios.get<
      IBackendRes<TalentDirectoryResponse>
    >(
      '/hr-talents',
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<TalentDirectoryResponse>
    >;
  },

  getByEmployeeId: (
    employeeId: string,
  ): Promise<
    IBackendRes<EmployeeTalentProfile>
  > => {
    return axios.get<
      IBackendRes<EmployeeTalentProfile>
    >(
      `/hr-talents/${employeeId}`,
    ) as unknown as Promise<
      IBackendRes<EmployeeTalentProfile>
    >;
  },

  getSkillMatrix: (
    params?: GetHrSkillMatrixParams,
  ): Promise<
    IBackendRes<HrSkillMatrixResponse>
  > => {
    return axios.get<
      IBackendRes<HrSkillMatrixResponse>
    >(
      '/hr-talents/analytics/skill-matrix',
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<HrSkillMatrixResponse>
    >;
  },

  getSkillEmployees: (
    skillId: string,
    params?: GetHrSkillEmployeesParams,
  ): Promise<
    IBackendRes<HrSkillEmployeesResponse>
  > => {
    return axios.get<
      IBackendRes<HrSkillEmployeesResponse>
    >(
      `/hr-talents/analytics/skills/${skillId}/employees`,
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<HrSkillEmployeesResponse>
    >;
  },

  getSkillSupplySummary:
    (): Promise<
      IBackendRes<HrSkillSupplySummary>
    > => {
      return axios.get<
        IBackendRes<HrSkillSupplySummary>
      >(
        '/hr-talents/analytics/skill-supply-summary',
      ) as unknown as Promise<
        IBackendRes<HrSkillSupplySummary>
      >;
    },

  getSkillSupplyRisk: (
    params?: GetHrSkillSupplyRiskParams,
  ): Promise<
    IBackendRes<HrSkillSupplyRiskResponse>
  > => {
    return axios.get<
      IBackendRes<HrSkillSupplyRiskResponse>
    >(
      '/hr-talents/analytics/skill-supply-risk',
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<HrSkillSupplyRiskResponse>
    >;
  },

  getTalentDataQuality: (
    params?: GetHrTalentDataQualityParams,
  ): Promise<
    IBackendRes<HrTalentDataQualityResponse>
  > => {
    return axios.get<
      IBackendRes<HrTalentDataQualityResponse>
    >(
      '/hr-talents/analytics/data-quality',
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<HrTalentDataQualityResponse>
    >;
  },

  getBenchTalents: (
    params?: GetHrBenchTalentsParams,
  ): Promise<
    IBackendRes<HrBenchTalentsResponse>
  > => {
    return axios.get<
      IBackendRes<HrBenchTalentsResponse>
    >(
      '/hr-talents/bench',
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<HrBenchTalentsResponse>
    >;
  },

  getBenchReadiness: (
    params:
      GetHrBenchReadinessParams = {},
  ): Promise<
    IBackendRes<HrBenchReadinessApiResponse>
  > => {
    return axios.get(
      '/hr-talents/bench/readiness',
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<HrBenchReadinessApiResponse>
    >;
  },
};