import React from 'react';

import {
  InfoCircleOutlined,
} from '@ant-design/icons';

import {
  Progress,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';

import type {
  HrBenchReadiness,
  HrBenchReadinessStatus,
} from '../../../../../api/hrTalents';

const {
  Text,
} = Typography;

interface BenchReadinessStatusProps {
  readiness: HrBenchReadiness;

  /**
   * compact = true:
   * dùng trong Table.
   *
   * compact = false:
   * dùng ở khu vực chi tiết.
   */
  compact?: boolean;
}

interface ReadinessStatusConfig {
  label: string;

  color:
    | 'success'
    | 'processing'
    | 'warning'
    | 'error';

  description: string;
}

const STATUS_CONFIG:
Record<
  HrBenchReadinessStatus,
  ReadinessStatusConfig
> = {
  READY: {
    label:
      'Sẵn sàng',

    color:
      'success',

    description:
      'Hồ sơ năng lực có dữ liệu tương đối đầy đủ, đã có minh chứng được duyệt và đạt ngưỡng sẵn sàng để HR xem xét điều phối.',
  },

  PARTIALLY_READY: {
    label:
      'Sẵn sàng một phần',

    color:
      'processing',

    description:
      'Hồ sơ đã đủ điều kiện cơ bản nhưng một số yếu tố về kỹ năng, minh chứng, hiệu suất hoặc độ mới của dữ liệu vẫn cần được cải thiện.',
  },

  NEEDS_VERIFICATION: {
    label:
      'Cần xác minh năng lực',

    color:
      'warning',

    description:
      'Nhân sự đã khai báo kỹ năng nhưng chưa có kỹ năng nào có minh chứng được duyệt.',
  },

  NEEDS_PROFILE_UPDATE: {
    label:
      'Cần cập nhật hồ sơ',

    color:
      'error',

    description:
      'Hồ sơ đang thiếu dữ liệu kỹ năng hoặc dữ liệu năng lực đã lâu chưa được cập nhật.',
  },
};

const BenchReadinessStatus:
React.FC<
  BenchReadinessStatusProps
> = ({
  readiness,
  compact = false,
}) => {
  const config =
    STATUS_CONFIG[
      readiness.status
    ];

  const tooltipContent = (
    <div
      style={{
        maxWidth: 320,
      }}
    >
      <div>
        <strong>
          Mức độ sẵn sàng
        </strong>
      </div>

      <div
        style={{
          marginTop: 4,
        }}
      >
        {config.description}
      </div>

      <div
        style={{
          marginTop: 8,
        }}
      >
        Điểm này hỗ trợ HR
        đánh giá hồ sơ nhân sự
        Bench. Đây không phải
        điểm phù hợp với một dự
        án cụ thể.
      </div>
    </div>
  );

  if (compact) {
    return (
      <Space
        orientation="vertical"
        size={4}
      >
        <Space size={6}>
          <Text strong>
            {readiness.score}
            /100
          </Text>

          <Tooltip
            title={
              tooltipContent
            }
          >
            <InfoCircleOutlined
              style={{
                cursor:
                  'help',
              }}
            />
          </Tooltip>
        </Space>

        <Tag
          color={
            config.color
          }
        >
          {config.label}
        </Tag>
      </Space>
    );
  }

  return (
    <Space
      direction="vertical"
      size={8}
      style={{
        width: '100%',
      }}
    >
      <Space size={8}>
        <Text strong>
          Mức độ sẵn sàng
        </Text>

        <Tooltip
          title={
            tooltipContent
          }
        >
          <InfoCircleOutlined
            style={{
              cursor:
                'help',
            }}
          />
        </Tooltip>
      </Space>

      <Progress
        percent={
          readiness.score
        }
        status={
          readiness.status ===
          'NEEDS_PROFILE_UPDATE'
            ? 'exception'
            : 'normal'
        }
        format={(
          percent,
        ) =>
          `${percent ?? 0}/100`
        }
      />

      <Tag
        color={
          config.color
        }
      >
        {config.label}
      </Tag>

      <Text type="secondary">
        {config.description}
      </Text>
    </Space>
  );
};

export default BenchReadinessStatus;