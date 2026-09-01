import React from 'react';

import {
  Card,
  Col,
  Progress,
  Row,
  Statistic,
  Typography,
} from 'antd';

import {
  TeamOutlined,
} from '@ant-design/icons';

import type {
  HrTalentDataQualityResponse,
} from '../../../api/hrTalents';

const {
  Text,
  Title,
} = Typography;

interface TalentDataQualitySummaryProps {
  summary:
    | HrTalentDataQualityResponse['summary']
    | undefined;

  staleDays: number;
}

const TalentDataQualitySummary:
React.FC<
  TalentDataQualitySummaryProps
> = ({
  summary,
  staleDays,
}) => {
  return (
    <Row
      gutter={[
        16,
        16,
      ]}
      style={{
        marginBottom: 16,
      }}
    >
      <Col
        xs={24}
        sm={12}
        lg={6}
      >
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            height: '100%',
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Statistic
            title="Tổng nhân sự"
            value={
              summary
                ?.totalEmployees ??
              0
            }
            prefix={
              <TeamOutlined />
            }
          />

          <Text type="secondary">
            Theo bộ lọc hiện tại
          </Text>
        </Card>
      </Col>

      <Col
        xs={24}
        sm={12}
        lg={6}
      >
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            height: '100%',
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Text type="secondary">
            Tỷ lệ kỹ năng
          </Text>

          <Title
            level={3}
            style={{
              margin:
                '6px 0 8px',
            }}
          >
            {summary
              ?.skillCoverageRate ??
              0}
            %
          </Title>

          <Progress
            percent={
              summary
                ?.skillCoverageRate ??
              0
            }
            showInfo={false}
          />

          <Text type="secondary">
            {summary
              ?.employeesWithSkills ??
              0}{' '}
            nhân sự có kỹ năng
          </Text>
        </Card>
      </Col>

      <Col
        xs={24}
        sm={12}
        lg={6}
      >
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            height: '100%',
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Text type="secondary">
            Tỷ lệ minh chứng
          </Text>

          <Title
            level={3}
            style={{
              margin:
                '6px 0 8px',
            }}
          >
            {summary
              ?.evidenceCoverageRate ??
              0}
            %
          </Title>

          <Progress
            percent={
              summary
                ?.evidenceCoverageRate ??
              0
            }
            showInfo={false}
          />

          <Text type="secondary">
            {summary
              ?.employeesWithApprovedEvidence ??
              0}{' '}
            nhân sự có minh chứng
            được duyệt
          </Text>
        </Card>
      </Col>

      <Col
        xs={24}
        sm={12}
        lg={6}
      >
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            height: '100%',
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Text type="secondary">
            Độ mới của hồ sơ
          </Text>

          <Title
            level={3}
            style={{
              margin:
                '6px 0 8px',
            }}
          >
            {summary
              ?.freshnessRate ??
              0}
            %
          </Title>

          <Progress
            percent={
              summary
                ?.freshnessRate ??
              0
            }
            showInfo={false}
          />

          <Text type="secondary">
            Ngưỡng{' '}
            {staleDays}{' '}
            ngày
          </Text>
        </Card>
      </Col>
    </Row>
  );
};

export default TalentDataQualitySummary;