import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AuditOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  RightOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  hrTalentsApi,
  type HrSkillSupplySummary,
  type HrTalentDataQualityResponse,
} from '../../api/hrTalents';
import {
  hrReviewsApi,
  type ReviewRecordStats,
} from '../../api/hrReviews';
import {
  hrWalletsApi,
  type WalletTransactionListItem,
} from '../../api/hrWallets';

const { Title, Text } = Typography;

interface DashboardState {
  talentTotal: number;
  benchTotal: number;
  inProjectTotal: number;
  reviewStats: ReviewRecordStats;
  dataQuality: HrTalentDataQualityResponse | null;
  skillSupply: HrSkillSupplySummary | null;
  walletTotal: number;
  rewardTransactionTotal: number;
  recentRewards: WalletTransactionListItem[];
}

const initialState: DashboardState = {
  talentTotal: 0,
  benchTotal: 0,
  inProjectTotal: 0,
  reviewStats: { total: 0, pending: 0, inReview: 0, completed: 0 },
  dataQuality: null,
  skillSupply: null,
  walletTotal: 0,
  rewardTransactionTotal: 0,
  recentRewards: [],
};

interface MetricCardProps {
  title: string;
  value: number;
  suffix?: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onOpen: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  suffix,
  description,
  icon,
  color,
  onOpen,
}) => (
  <Card
    hoverable
    onClick={onOpen}
    style={{ height: '100%', borderRadius: 12, cursor: 'pointer' }}
    styles={{ body: { padding: 20 } }}
  >
    <Flex justify="space-between" align="flex-start" gap={12}>
      <div>
        <Statistic
          title={title}
          value={value}
          suffix={suffix}
          valueStyle={{ color, fontWeight: 700 }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {description}
        </Text>
      </div>
      <div
        style={{
          color,
          background: `${color}14`,
          borderRadius: 10,
          padding: 10,
          fontSize: 20,
        }}
      >
        {icon}
      </div>
    </Flex>
  </Card>
);

const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [failedSources, setFailedSources] = useState(0);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    const results = await Promise.allSettled([
      hrTalentsApi.getAll({ page: 1, limit: 1 }),
      hrTalentsApi.getBenchTalents({ page: 1, limit: 1 }),
      hrTalentsApi.getAll({ page: 1, limit: 1, status: 'IN_PROJECT' }),
      hrReviewsApi.getStats(),
      hrTalentsApi.getTalentDataQuality({ staleDays: 90 }),
      hrTalentsApi.getSkillSupplySummary(),
      hrWalletsApi.getAllWallets({ page: 1, limit: 1 }),
      hrWalletsApi.getAllTransactions({ page: 1, limit: 5, type: 'REWARD' }),
    ]);

    const payload = <T,>(index: number): T | null => {
      const result = results[index];
      return result.status === 'fulfilled'
        ? ((result.value as IBackendRes<T>)?.data ?? null)
        : null;
    };

    const talents = payload<any>(0);
    const bench = payload<any>(1);
    const inProject = payload<any>(2);
    const reviewStats = payload<ReviewRecordStats>(3);
    const dataQuality = payload<HrTalentDataQualityResponse>(4);
    const skillSupply = payload<HrSkillSupplySummary>(5);
    const wallets = payload<any>(6);
    const rewards = payload<any>(7);

    setData({
      talentTotal: Number(talents?.meta?.total ?? 0),
      benchTotal: Number(bench?.meta?.total ?? 0),
      inProjectTotal: Number(inProject?.meta?.total ?? 0),
      reviewStats: reviewStats ?? initialState.reviewStats,
      dataQuality,
      skillSupply,
      walletTotal: Number(wallets?.meta?.total ?? 0),
      rewardTransactionTotal: Number(rewards?.meta?.total ?? 0),
      recentRewards: rewards?.result ?? [],
    });
    setFailedSources(
      results.filter((result) => result.status === 'rejected').length,
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const benchRate =
    data.talentTotal === 0
      ? 0
      : Number(((data.benchTotal / data.talentTotal) * 100).toFixed(1));
  const reviewCompletionRate =
    data.reviewStats.total === 0
      ? 0
      : Number(
          (
            (data.reviewStats.completed / data.reviewStats.total) *
            100
          ).toFixed(1),
        );

  const skillColumns = useMemo<ColumnsType<HrSkillSupplySummary['topSupplySkills'][number]>>(
    () => [
      { title: 'Kỹ năng', dataIndex: 'name', key: 'name' },
      {
        title: 'Nhân sự',
        dataIndex: 'totalEmployees',
        key: 'totalEmployees',
        align: 'right',
      },
      {
        title: 'Level 4+',
        dataIndex: 'level4Plus',
        key: 'level4Plus',
        align: 'right',
      },
    ],
    [],
  );

  const rewardColumns = useMemo<ColumnsType<WalletTransactionListItem>>(
    () => [
      {
        title: 'Nhân viên',
        key: 'employee',
        render: (_, item) =>
          item.wallet?.employee?.fullName ??
          item.wallet?.employee?.email ??
          'Không xác định',
      },
      {
        title: 'Số token',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        render: (amount: number) => (
          <Tag color="green">+{Number(amount).toLocaleString('vi-VN')}</Tag>
        ),
      },
      {
        title: 'Lý do',
        dataIndex: 'reason',
        key: 'reason',
      },
      {
        title: 'Thời gian',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value: string) => new Date(value).toLocaleString('vi-VN'),
      },
    ],
    [],
  );

  const quality = data.dataQuality?.summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Bảng điều khiển HR
          </Title>
          <Text type="secondary">
            Tổng quan thời gian thực từ Talent, Review và F-Token.
          </Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadDashboard}>
            Làm mới
          </Button>
          <Button onClick={() => navigate('/hr/talents')}>
            Quản lý năng lực
          </Button>
          <Button type="primary" onClick={() => navigate('/hr/review')}>
            Xử lý đánh giá
          </Button>
        </Space>
      </Flex>

      {failedSources > 0 && (
        <Alert
          showIcon
          type="warning"
          message="Dashboard đang hiển thị dữ liệu một phần"
          description={`${failedSources} nguồn dữ liệu chưa tải được. Hãy kiểm tra quyền hoặc kết nối backend rồi thử lại.`}
        />
      )}

      {loading ? (
        <Card><Skeleton active /></Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="Nhân sự kỹ thuật"
                value={data.talentTotal}
                description="Population mặc định: DEVELOPER"
                icon={<TeamOutlined />}
                color="#1677ff"
                onOpen={() => navigate('/hr/talents')}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="Đang Bench"
                value={data.benchTotal}
                description={`${benchRate}% population kỹ thuật`}
                icon={<TeamOutlined />}
                color="#d46b08"
                onOpen={() => navigate('/hr/bench')}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="Đang trong dự án"
                value={data.inProjectTotal}
                description="Theo workforce status hiện tại"
                icon={<CheckCircleOutlined />}
                color="#389e0d"
                onOpen={() => navigate('/hr/talents')}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="Review cần xử lý"
                value={data.reviewStats.pending + data.reviewStats.inReview}
                description={`${data.reviewStats.completed}/${data.reviewStats.total} đã hoàn tất`}
                icon={<AuditOutlined />}
                color="#722ed1"
                onOpen={() => navigate('/hr/review')}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Chất lượng dữ liệu năng lực"
                extra={
                  <Button type="link" onClick={() => navigate('/hr/talents')}>
                    Xem chi tiết <RightOutlined />
                  </Button>
                }
                style={{ height: '100%', borderRadius: 12 }}
              >
                {quality ? (
                  <Space direction="vertical" size={18} style={{ width: '100%' }}>
                    <div>
                      <Flex justify="space-between">
                        <Text>Nhân sự có kỹ năng</Text>
                        <Text strong>{quality.skillCoverageRate}%</Text>
                      </Flex>
                      <Progress percent={quality.skillCoverageRate} showInfo={false} />
                    </div>
                    <div>
                      <Flex justify="space-between">
                        <Text>Có minh chứng đã duyệt</Text>
                        <Text strong>{quality.evidenceCoverageRate}%</Text>
                      </Flex>
                      <Progress
                        percent={quality.evidenceCoverageRate}
                        showInfo={false}
                        strokeColor="#52c41a"
                      />
                    </div>
                    <Row gutter={12}>
                      <Col span={8}>
                        <Statistic title="Thiếu kỹ năng" value={quality.employeesWithoutSkills} />
                      </Col>
                      <Col span={8}>
                        <Statistic title="Evidence chờ duyệt" value={quality.totalPendingEvidences} />
                      </Col>
                      <Col span={8}>
                        <Statistic title="Hồ sơ cũ" value={quality.staleProfiles} />
                      </Col>
                    </Row>
                  </Space>
                ) : (
                  <Empty description="Chưa có dữ liệu chất lượng" />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title="Tiến độ Review"
                extra={
                  <Button type="link" onClick={() => navigate('/hr/review')}>
                    Review Console <RightOutlined />
                  </Button>
                }
                style={{ height: '100%', borderRadius: 12 }}
              >
                <Flex align="center" gap={28} wrap="wrap">
                  <Progress type="circle" percent={reviewCompletionRate} />
                  <Space direction="vertical" size={10}>
                    <Text>Chờ xử lý: <strong>{data.reviewStats.pending}</strong></Text>
                    <Text>Đang đánh giá: <strong>{data.reviewStats.inReview}</strong></Text>
                    <Text>Hoàn tất: <strong>{data.reviewStats.completed}</strong></Text>
                  </Space>
                </Flex>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Nguồn cung kỹ năng hàng đầu"
                extra={<DatabaseOutlined />}
                style={{ height: '100%', borderRadius: 12 }}
              >
                <Table
                  rowKey="skillId"
                  size="small"
                  pagination={false}
                  columns={skillColumns}
                  dataSource={data.skillSupply?.topSupplySkills ?? []}
                  locale={{ emptyText: 'Chưa có nguồn cung kỹ năng' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tỷ lệ employee-skill pair có evidence đã duyệt:{' '}
                  {data.skillSupply?.coverage.verificationRate ?? 0}%
                </Text>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title="F-Token thực tế"
                extra={
                  <Button type="link" onClick={() => navigate('/hr/wallet')}>
                    Quản lý ví <RightOutlined />
                  </Button>
                }
                style={{ height: '100%', borderRadius: 12 }}
              >
                <Row gutter={12} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Statistic
                      title="Tổng số ví"
                      value={data.walletTotal}
                      prefix={<WalletOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Giao dịch thưởng"
                      value={data.rewardTransactionTotal}
                    />
                  </Col>
                </Row>
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={rewardColumns}
                  dataSource={data.recentRewards}
                  scroll={{ x: 620 }}
                  locale={{ emptyText: 'Chưa có giao dịch thưởng' }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default HRDashboard;
