import React from 'react';

import {
  Table,
} from 'antd';

import type {
  HrBenchReadinessItem,
} from '../../../../api/hrTalents';

import {
  getBenchTalentColumns,
} from './bench-talent-table.columns';

interface BenchTalentTableProps {
  data: HrBenchReadinessItem[];

  loading: boolean;

  page: number;

  pageSize: number;

  total: number;

  onPageChange: (
    page: number,
  ) => void;

  onViewProfile: (
    employeeId: string,
  ) => void;

  onViewReadiness: (
    talent: HrBenchReadinessItem,
  ) => void;
}

const BenchTalentTable:
  React.FC<
    BenchTalentTableProps
  > = ({
    data,
    loading,
    page,
    pageSize,
    total,
    onPageChange,
    onViewProfile,
    onViewReadiness,
  }) => {
    const columns =
      getBenchTalentColumns({
        onViewProfile,
        onViewReadiness,
      });

    return (
      <Table
        rowKey={(
          record,
        ) =>
          record.employee.id
        }
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{
          x: 1550,
        }}
        pagination={{
          current: page,

          pageSize,

          total,

          showSizeChanger:
            false,

          showTotal: (
            value,
          ) =>
            `${value} nhân sự Bench`,

          onChange: (
            nextPage,
          ) =>
            onPageChange(
              nextPage,
            ),
        }}
      />
    );
  };

export default BenchTalentTable;