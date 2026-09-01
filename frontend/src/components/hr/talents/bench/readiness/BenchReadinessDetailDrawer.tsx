import React from 'react';

import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

import {
  Card,
  Col,
  Drawer,
  Progress,
  Row,
  Space,
  Tooltip,
  Typography,
} from 'antd';

import type {
  HrBenchReadinessItem,
} from '../../../../../api/hrTalents';

import BenchReadinessStatus from './BenchReadinessStatus';

const {
  Text,
  Title,
} = Typography;

interface BenchReadinessDetailDrawerProps {
  open: boolean;

  talent:
    | HrBenchReadinessItem
    | null;

  onClose: () => void;
}

interface ScoreCardProps {
  title: string;

  score: number;

  maxScore: number;

  description: string;

  tooltip?: string;
}

const ScoreCard:
React.FC<ScoreCardProps> = ({
  title,
  score,
  maxScore,
  description,
  tooltip,
}) => {
  const percent =
    maxScore === 0
      ? 0
      : Number(
          (
            score /
            maxScore *
            100
          ).toFixed(1),
        );

  return (
    <Card
      size="small"
      variant="outlined"
      style={{
        height: '100%',
      }}
    >
      <Space
        orientation="vertical"
        size={6}
        style={{
          width: '100%',
        }}
      >
        <Space size={6}>
          <Text strong>
            {title}
          </Text>

          {tooltip && (
            <Tooltip
              title={tooltip}
            >
              <InfoCircleOutlined
                style={{
                  cursor:
                    'help',
                }}
              />
            </Tooltip>
          )}
        </Space>

        <Title
          level={4}
          style={{
            margin: 0,
          }}
        >
          {score}/{maxScore}
        </Title>

        <Progress
          percent={percent}
          showInfo={false}
          size="small"
        />

        <Text
          type="secondary"
          style={{
            fontSize: 12,
          }}
        >
          {description}
        </Text>
      </Space>
    </Card>
  );
};

const BenchReadinessDetailDrawer:
React.FC<
  BenchReadinessDetailDrawerProps
> = ({
  open,
  talent,
  onClose,
}) => {
  if (!talent) {
    return null;
  }

  const {
    employee,
    readiness,
  } = talent;

  const {
    skill,
    evidence,
    performance,
    freshness,
  } =
    readiness.components;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={760}
      title="Chi tiết mức độ sẵn sàng"
    >
      <Space
        orientation="vertical"
        size={20}
        style={{
          width: '100%',
        }}
      >
        <div>
          <Title
            level={4}
            style={{
              marginBottom: 2,
            }}
          >
            {employee.fullName}
          </Title>

          <Text type="secondary">
            {employee.title ??
              'Chưa cập nhật chức danh'}
          </Text>
        </div>

        <Card variant="outlined">
          <BenchReadinessStatus
            readiness={
              readiness
            }
          />
        </Card>

        <div>
          <Title level={5}>
            Chi tiết đánh giá
          </Title>

          <Row gutter={[12, 12]}>
            <Col
              xs={24}
              md={12}
            >
              <ScoreCard
                title="Kỹ năng"
                score={
                  skill.score
                }
                maxScore={
                  skill.maxScore
                }
                description={
                  `${skill.skillCount} kỹ năng, cấp độ trung bình nhóm nổi bật: ${skill.averageTopLevel}`
                }
                tooltip="Đánh giá dựa trên cấp độ của tối đa 3 kỹ năng nổi bật và độ đa dạng kỹ năng trong hồ sơ."
              />
            </Col>

            <Col
              xs={24}
              md={12}
            >
              <ScoreCard
                title="Minh chứng năng lực"
                score={
                  evidence.score
                }
                maxScore={
                  evidence.maxScore
                }
                description={
                  `${evidence.coverageRate}% kỹ năng có minh chứng được duyệt`
                }
                tooltip="Tỷ lệ kỹ năng có ít nhất một minh chứng năng lực đã được duyệt."
              />
            </Col>

            <Col
              xs={24}
              md={12}
            >
              <ScoreCard
                title="Hiệu suất"
                score={
                  performance.score
                }
                maxScore={
                  performance.maxScore
                }
                description={
                  performance.hasCompletedReview
                    ? `Điểm đánh giá gần nhất: ${performance.latestFinalScore}`
                    : 'Chưa có kỳ đánh giá hiệu suất hoàn tất'
                }
                tooltip="Sử dụng kết quả cuối cùng của kỳ đánh giá hiệu suất gần nhất đã hoàn tất."
              />
            </Col>

            <Col
              xs={24}
              md={12}
            >
              <ScoreCard
                title="Độ mới của hồ sơ"
                score={
                  freshness.score
                }
                maxScore={
                  freshness.maxScore
                }
                description={
                  freshness.daysSinceUpdate ===
                  null
                    ? 'Chưa xác định được lần cập nhật gần nhất'
                    : `Cập nhật gần nhất cách đây ${freshness.daysSinceUpdate} ngày`
                }
                tooltip="Đánh giá mức độ cập nhật của dữ liệu kỹ năng và minh chứng năng lực. Hồ sơ lâu không cập nhật có thể không còn phản ánh chính xác năng lực hiện tại."
              />
            </Col>
          </Row>
        </div>

        <Card
          title="Điểm mạnh"
          variant="outlined"
        >
          {readiness.strengths
            .length === 0 ? (
            <Text type="secondary">
              Chưa có điểm mạnh nổi bật
              từ dữ liệu hiện tại.
            </Text>
          ) : (
            <Space
              orientation="vertical"
              size={10}
            >
              {readiness.strengths.map(
                (
                  strength,
                  index,
                ) => (
                  <Space
                    key={`${strength}-${index}`}
                    align="start"
                  >
                    <CheckCircleOutlined />

                    <Text>
                      {strength}
                    </Text>
                  </Space>
                ),
              )}
            </Space>
          )}
        </Card>

        <Card
          title="Nội dung cần cải thiện"
          variant="outlined"
        >
          {readiness.issues
            .length === 0 ? (
            <Text type="secondary">
              Chưa phát hiện vấn đề
              đáng chú ý từ dữ liệu
              hiện tại.
            </Text>
          ) : (
            <Space
              orientation="vertical"
              size={10}
            >
              {readiness.issues.map(
                (
                  issue,
                  index,
                ) => (
                  <Space
                    key={`${issue}-${index}`}
                    align="start"
                  >
                    <ExclamationCircleOutlined />

                    <Text>
                      {issue}
                    </Text>
                  </Space>
                ),
              )}
            </Space>
          )}
        </Card>

        <Text type="secondary">
          Điểm mức độ sẵn sàng chỉ hỗ trợ
          HR đánh giá chất lượng và mức độ
          hoàn thiện của hồ sơ nhân sự Bench.
          Kết quả này không phải điểm phù hợp
          với một dự án cụ thể.
        </Text>
      </Space>
    </Drawer>
  );
};

export default BenchReadinessDetailDrawer;