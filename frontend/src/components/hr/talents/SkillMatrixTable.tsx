import React from 'react';
import {
  Empty,
  Flex,
  Progress,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type {
  HrSkillMatrixItem,
} from '../../../api/hrTalents';

const { Text } = Typography;

interface SkillMatrixTableProps {
  data: HrSkillMatrixItem[];
  loading: boolean;

  page: number;
  pageSize: number;
  total: number;

  onPageChange: (
    page: number,
    pageSize: number,
  ) => void;
}

const SkillMatrixTable: React.FC<
  SkillMatrixTableProps
> = ({
  data,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
}) => {
  const columns: ColumnsType<HrSkillMatrixItem> =
    [
      {
        title: 'Kỹ năng',
        key: 'skill',
        width: 220,

        render: (_, record) => (
          <div>
            <Text strong>
              {record.name}
            </Text>

            {record.description && (
              <div>
                <Text
                  type="secondary"
                  ellipsis
                  style={{
                    fontSize: 12,
                  }}
                >
                  {
                    record.description
                  }
                </Text>
              </div>
            )}
          </div>
        ),
      },

      {
        title: 'Nhân sự',
        dataIndex:
          'totalEmployees',
        key: 'totalEmployees',
        width: 100,
        align: 'center',

        render: (
          value: number,
        ) => (
          <Text strong>
            {value}
          </Text>
        ),
      },

      {
        title: 'Level 3+',
        dataIndex:
          'level3Plus',
        key: 'level3Plus',
        width: 100,
        align: 'center',
      },

      {
        title: 'Level 4+',
        dataIndex:
          'level4Plus',
        key: 'level4Plus',
        width: 100,
        align: 'center',
      },

      {
        title: 'Xác minh',
        key: 'verification',
        width: 190,

        render: (_, record) => (
          <Flex
            vertical
            gap={4}
          >
            <Progress
              percent={
                record.verificationRate
              }
              size="small"
            />

            <Text
              type="secondary"
              style={{
                fontSize: 11,
              }}
            >
              {
                record.employeesWithApprovedEvidence
              }
              /
              {
                record.totalEmployees
              }{' '}
              nhân sự
            </Text>
          </Flex>
        ),
      },

      {
        title: 'Evidence',
        key: 'evidence',
        width: 160,

        render: (_, record) => (
          <Flex
            gap={6}
            wrap="wrap"
          >
            <Tag color="green">
              Approved:{' '}
              {
                record.evidence
                  .approved
              }
            </Tag>

            <Tag color="gold">
              Pending:{' '}
              {
                record.evidence
                  .pending
              }
            </Tag>
          </Flex>
        ),
      },

      {
        title: 'Nguồn lực',
        key: 'workforce',
        width: 260,

        render: (_, record) => (
          <Flex
            gap={6}
            wrap="wrap"
          >
            <Tag color="green">
              Available:{' '}
              {
                record.workforce
                  .available
              }
            </Tag>

            <Tag color="blue">
              Project:{' '}
              {
                record.workforce
                  .inProject
              }
            </Tag>

            <Tag color="orange">
              Bench:{' '}
              {
                record.workforce
                  .bench
              }
            </Tag>
          </Flex>
        ),
      },
    ];

  return (
    <Table<HrSkillMatrixItem>
      rowKey="skillId"
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{
        x: 1100,
      }}
      locale={{
        emptyText: (
          <Empty
            description="Chưa có dữ liệu kỹ năng"
          />
        ),
      }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,

        showTotal: (
          value,
        ) =>
          `Tổng ${value} kỹ năng`,

        onChange:
          onPageChange,
      }}
    />
  );
};

export default SkillMatrixTable;