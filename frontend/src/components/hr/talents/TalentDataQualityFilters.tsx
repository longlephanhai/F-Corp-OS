import React from 'react';

import {
  Button,
  Card,
  Flex,
  InputNumber,
  Select,
  Space,
  Typography,
} from 'antd';

import {
  ReloadOutlined,
} from '@ant-design/icons';

const {
  Text,
} = Typography;

interface TalentDataQualityFiltersProps {
  role?: string;

  staleDays: number;

  loading: boolean;

  onRoleChange: (
    value: string | undefined,
  ) => void;

  onStaleDaysChange: (
    value: number,
  ) => void;

  onReset: () => void;

  onReload: () => void;
}

const TalentDataQualityFilters:
React.FC<
  TalentDataQualityFiltersProps
> = ({
  role,
  staleDays,
  loading,
  onRoleChange,
  onStaleDaysChange,
  onReset,
  onReload,
}) => {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 12,
        marginBottom: 16,
        boxShadow:
          '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{
        body: {
          padding: 16,
        },
      }}
    >
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={12}
      >
        <Space
          wrap
          size={10}
        >
          <Select
            allowClear
            value={role}
            placeholder="Vai trò nhân sự"
            style={{
              width: 180,
            }}
            onChange={
              onRoleChange
            }
            options={[
              {
                value:
                  'DEVELOPER',
                label:
                  'Lập trình viên',
              },
              {
                value:
                  'PM',
                label:
                  'Quản lý dự án',
              },
              {
                value:
                  'HR',
                label:
                  'Nhân sự',
              },
              {
                value:
                  'ADMIN',
                label:
                  'Quản trị viên',
              },
            ]}
          />

          <Space size={6}>
            <Text type="secondary">
              Hồ sơ được xem là cũ sau
            </Text>

            <InputNumber
              min={1}
              max={3650}
              value={
                staleDays
              }
              onChange={(
                value,
              ) =>
                onStaleDaysChange(
                  value ?? 90,
                )
              }
              style={{
                width: 90,
              }}
            />

            <Text type="secondary">
              ngày
            </Text>
          </Space>

          <Button
            onClick={
              onReset
            }
          >
            Xóa bộ lọc
          </Button>
        </Space>

        <Button
          icon={
            <ReloadOutlined />
          }
          loading={
            loading
          }
          onClick={
            onReload
          }
        >
          Làm mới
        </Button>
      </Flex>
    </Card>
  );
};

export default TalentDataQualityFilters;