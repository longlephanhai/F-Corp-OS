import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  Button,
  Flex,
  Skeleton,
  Typography,
  message,
} from 'antd';

import {
  ReloadOutlined,
} from '@ant-design/icons';

import {
  hrDashboardApi,
  type HrDashboardSummary,
} from '../../api/hrDashboard';

import HrDashboardOverview from '../../components/hr/dashboard/HrDashboardOverview';
import HrDashboardOperations from '../../components/hr/dashboard/HrDashboardOperations';
import HrDashboardInsights from '../../components/hr/dashboard/HrDashboardInsights';

const {
  Title,
  Text,
} = Typography;

const HRDashboard: React.FC = () => {
  const [data, setData] =
    useState<HrDashboardSummary | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const fetchDashboard =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await hrDashboardApi
            .getSummary();

        const payload =
          (response as any)?.data;

        if (!payload) {
          throw new Error(
            'Không nhận được dữ liệu Dashboard.',
          );
        }

        setData(payload);
      } catch (err: any) {
        const errorMessage =
          err?.message ??
          'Không thể tải dữ liệu Dashboard.';

        setError(
          errorMessage,
        );

        message.error(
          errorMessage,
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (
    loading &&
    !data
  ) {
    return (
      <Flex
        vertical
        gap={16}
      >
        <Skeleton active />

        <Skeleton active />

        <Skeleton active />
      </Flex>
    );
  }

  if (
    error &&
    !data
  ) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải Bảng điều khiển HR"
        description={error}
        action={
          <Button
            icon={
              <ReloadOutlined />
            }
            onClick={
              fetchDashboard
            }
          >
            Thử lại
          </Button>
        }
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Flex
      vertical
      gap={24}
    >
      <Flex
        justify="space-between"
        align="center"
        gap={16}
        wrap="wrap"
      >
        <div>
          <Title
            level={3}
            style={{
              margin: 0,
            }}
          >
            Bảng điều khiển Nhân sự
          </Title>

          <Text type="secondary">
            Tổng quan dữ liệu nhân sự hiện tại
          </Text>
        </div>

        <Button
          icon={
            <ReloadOutlined />
          }
          loading={loading}
          onClick={
            fetchDashboard
          }
        >
          Làm mới dữ liệu
        </Button>
      </Flex>

      <HrDashboardOverview
        data={data}
      />

      <HrDashboardOperations
        data={data}
      />

      <HrDashboardInsights
        data={data}
      />
    </Flex>
  );
};

export default HRDashboard;