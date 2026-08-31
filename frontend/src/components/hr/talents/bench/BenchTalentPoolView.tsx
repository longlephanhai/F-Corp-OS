import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Card,
  Typography,
  message,
} from 'antd';

import {
  hrTalentsApi,
  type HrBenchTalentItem,
} from '../../../../api/hrTalents';

import BenchTalentFilters, {
  type BenchSkillOption,
} from './BenchTalentFilters';

import BenchTalentTable from './BenchTalentTable';
import TalentProfileDrawer from '../TalentProfileDrawer';

const { Text } = Typography;

const PAGE_SIZE = 10;

const BenchTalentPoolView: React.FC = () => {
  const [talents, setTalents] =
    useState<HrBenchTalentItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [skillsLoading, setSkillsLoading] =
    useState(false);

  const [skillOptions, setSkillOptions] =
    useState<BenchSkillOption[]>([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [role, setRole] =
    useState<string>();

  const [skillId, setSkillId] =
    useState<string>();

  const [minLevel, setMinLevel] =
    useState<number>();

  const [verified, setVerified] =
    useState<boolean>();

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState<string | null>(null);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const loadBenchTalents =
    useCallback(async () => {
      setLoading(true);

      try {
        const response =
          await hrTalentsApi.getBenchTalents({
            page,
            limit: PAGE_SIZE,
            search: search || undefined,
            role,
            skillId,
            minLevel,
            verified,
          });

        const data = response?.data;

        setTalents(
          data?.result ?? [],
        );

        setTotal(
          data?.meta?.total ?? 0,
        );
      } catch (error) {
        console.error(
          'Không tải được Bench Talent Pool',
          error,
        );

        setTalents([]);
        setTotal(0);

        message.error(
          'Không thể tải danh sách nhân sự Bench.',
        );
      } finally {
        setLoading(false);
      }
    }, [
      page,
      search,
      role,
      skillId,
      minLevel,
      verified,
    ]);

  const loadSkillOptions =
    useCallback(async () => {
      setSkillsLoading(true);

      try {
        const response =
          await hrTalentsApi.getSkillMatrix({
            page: 1,
            limit: 100,
          });

        const skills =
          response?.data?.result ?? [];

        setSkillOptions(
          skills.map((skill) => ({
            value: skill.skillId,
            label: skill.name,
          })),
        );
      } catch (error) {
        console.error(
          'Không tải được Skill Catalog',
          error,
        );

        setSkillOptions([]);

        message.error(
          'Không thể tải danh sách kỹ năng.',
        );
      } finally {
        setSkillsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadBenchTalents();
  }, [loadBenchTalents]);

  useEffect(() => {
    void loadSkillOptions();
  }, [loadSkillOptions]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleRoleChange = (
    value: string | undefined,
  ) => {
    setPage(1);
    setRole(value);
  };

  const handleSkillChange = (
    value: string | undefined,
  ) => {
    setPage(1);
    setSkillId(value);
  };

  const handleMinLevelChange = (
    value: number | undefined,
  ) => {
    setPage(1);
    setMinLevel(value);
  };

  const handleVerifiedChange = (
    value: boolean | undefined,
  ) => {
    setPage(1);
    setVerified(value);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearch('');
    setRole(undefined);
    setSkillId(undefined);
    setMinLevel(undefined);
    setVerified(undefined);
    setPage(1);
  };

  const handleViewProfile = (
    employeeId: string,
  ) => {
    setSelectedEmployeeId(employeeId);
    setProfileOpen(true);
  };

  const handleCloseProfile = () => {
    setProfileOpen(false);
    setSelectedEmployeeId(null);
  };

  return (
    <>
      <BenchTalentFilters
        searchInput={searchInput}
        role={role}
        skillId={skillId}
        minLevel={minLevel}
        verified={verified}
        skillOptions={skillOptions}
        skillsLoading={skillsLoading}
        loading={loading}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        onRoleChange={handleRoleChange}
        onSkillChange={handleSkillChange}
        onMinLevelChange={
          handleMinLevelChange
        }
        onVerifiedChange={
          handleVerifiedChange
        }
        onReset={handleReset}
        onReload={() =>
          void loadBenchTalents()
        }
      />

      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow:
            '0 2px 8px rgba(0,0,0,0.04)',
        }}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <div
          style={{
            padding:
              '14px 16px 0',
          }}
        >
          <Text type="secondary">
            {total} nhân sự đang Bench
          </Text>
        </div>

        <BenchTalentTable
          data={talents}
          loading={loading}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          onViewProfile={
            handleViewProfile
          }
        />
      </Card>

      <TalentProfileDrawer
        open={profileOpen}
        employeeId={
          selectedEmployeeId
        }
        onClose={
          handleCloseProfile
        }
      />
    </>
  );
};

export default BenchTalentPoolView;