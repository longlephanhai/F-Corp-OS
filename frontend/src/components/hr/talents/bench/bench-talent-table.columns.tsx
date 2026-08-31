import React from 'react';

import {
  Button,
  Progress,
  Space,
  Tag,
  Typography,
} from 'antd';

import type {
  ColumnsType,
} from 'antd/es/table';

import type {
  HrBenchTalentItem,
} from '../../../../api/hrTalents';

const {
  Text,
} = Typography;

interface GetBenchTalentColumnsOptions {
  onViewProfile: (
    employeeId: string,
  ) => void;
}

const formatDate = (
  value: string | null,
) => {
  if (!value) {
    return 'Chưa có dữ liệu';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Không xác định';
  }

  return date.toLocaleDateString(
    'vi-VN',
  );
};

export const getBenchTalentColumns = ({
  onViewProfile,
}: GetBenchTalentColumnsOptions):
ColumnsType<HrBenchTalentItem> => [
  {
    title: 'Nhân sự',
    key: 'employee',
    width: 240,

    render: (
      _,
      record,
    ) => (
      <Space
        direction="vertical"
        size={0}
      >
        <Text strong>
          {
            record.employee
              .fullName
          }
        </Text>

        <Text
          type="secondary"
          style={{
            fontSize: 12,
          }}
        >
          {
            record.employee
              .email
          }
        </Text>

        {record.employee
          .title && (
          <Text
            type="secondary"
            style={{
              fontSize: 12,
            }}
          >
            {
              record.employee
                .title
            }
          </Text>
        )}
      </Space>
    ),
  },

  {
    title: 'Vai trò',
    key: 'role',
    width: 130,

    render: (
      _,
      record,
    ) =>
      record.employee
        .role?.name ?? '-',
  },

  {
    title: 'Top kỹ năng',
    key: 'skills',
    width: 310,

    render: (
      _,
      record,
    ) => {
      if (
        record.topSkills
          .length === 0
      ) {
        return (
          <Text type="secondary">
            Chưa có kỹ năng
          </Text>
        );
      }

      return (
        <Space
          wrap
          size={[4, 4]}
        >
          {record.topSkills.map(
            (skill) => (
              <Tag
                key={
                  skill.userSkillId
                }
              >
                {skill.name}{' '}
                L{skill.level}
                {skill.hasApprovedEvidence
                  ? ' ✓'
                  : ''}
              </Tag>
            ),
          )}
        </Space>
      );
    },
  },

  {
    title: 'Evidence',
    key: 'evidence',
    width: 190,

    render: (
      _,
      record,
    ) => (
      <Space
        direction="vertical"
        size={4}
        style={{
          width: '100%',
        }}
      >
        <Progress
          percent={
            record.skillSummary
              .evidenceCoverageRate
          }
          size="small"
        />

        <Text
          type="secondary"
          style={{
            fontSize: 12,
          }}
        >
          {
            record.skillSummary
              .skillsWithApprovedEvidence
          }
          /
          {
            record.skillSummary
              .totalSkills
          }{' '}
          kỹ năng đã xác minh
        </Text>

        {record.skillSummary
          .pendingEvidences >
          0 && (
          <Tag color="processing">
            {
              record.skillSummary
                .pendingEvidences
            }{' '}
            pending
          </Tag>
        )}
      </Space>
    ),
  },

  {
    title: 'Hiệu suất gần nhất',
    key: 'performance',
    width: 170,

    render: (
      _,
      record,
    ) => {
      const {
        latestFinalScore,
        latestReviewCycle,
      } =
        record.performance;

      if (
        latestFinalScore ===
        null
      ) {
        return (
          <Text type="secondary">
            Chưa có đánh giá
          </Text>
        );
      }

      return (
        <Space
          direction="vertical"
          size={0}
        >
          <Text strong>
            {latestFinalScore}
          </Text>

          <Text
            type="secondary"
            style={{
              fontSize: 12,
            }}
          >
            {latestReviewCycle
              ?.name ??
              'Không rõ chu kỳ'}
          </Text>
        </Space>
      );
    },
  },

  {
    title: 'Talent cập nhật',
    key: 'updated',
    width: 150,

    render: (
      _,
      record,
    ) => (
      <Text>
        {formatDate(
          record
            .lastTalentDataUpdatedAt,
        )}
      </Text>
    ),
  },

  {
    title: 'Thao tác',
    key: 'action',
    fixed: 'right',
    width: 120,

    render: (
      _,
      record,
    ) => (
      <Button
        type="link"
        onClick={() =>
          onViewProfile(
            record.employee.id,
          )
        }
      >
        Xem hồ sơ
      </Button>
    ),
  },
];