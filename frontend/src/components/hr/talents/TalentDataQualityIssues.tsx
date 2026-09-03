import React from 'react';

import {
  Card,
  Col,
  Flex,
  Row,
  Space,
  Typography,
} from 'antd';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileSearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';

import type {
  HrTalentDataQualityResponse,
} from '../../../api/hrTalents';

import type {
  TalentDataQualityIssueType,
} from './TalentDataQualityIssueDrawer';

const {
  Text,
  Title,
} = Typography;

interface TalentDataQualityIssuesProps {
  summary:
  | HrTalentDataQualityResponse['summary']
  | undefined;

  staleDays: number;

  onOpenIssue: (
    issue: TalentDataQualityIssueType,
  ) => void;
}

interface IssueCardProps {
  title: string;

  description: string;

  count: number;

  icon: React.ReactNode;

  onClick: () => void;
}

const IssueCard:
  React.FC<IssueCardProps> = ({
    title,
    description,
    count,
    icon,
    onClick,
  }) => {
    return (
      <Card
        bordered={false}
        hoverable
        onClick={onClick}
        style={{
          height: '100%',
          borderRadius: 12,
          cursor: 'pointer',
          boxShadow:
            '0 2px 8px rgba(0,0,0,0.04)',
        }}
        styles={{
          body: {
            padding: 18,
          },
        }}
      >
        <Flex
          justify="space-between"
          align="flex-start"
          gap={16}
        >
          <Space
            direction="vertical"
            size={4}
          >
            <Text strong>
              {title}
            </Text>

            <Text
              type="secondary"
              style={{
                fontSize: 13,
              }}
            >
              {description}
            </Text>
          </Space>

          <div
            style={{
              fontSize: 22,
            }}
          >
            {icon}
          </div>
        </Flex>

        <div
          style={{
            marginTop: 16,
          }}
        >
          <Title
            level={3}
            style={{
              margin: 0,
            }}
          >
            {count}
          </Title>

          <Text type="secondary">
            nhân sự
          </Text>
        </div>
      </Card>
    );
  };

const TalentDataQualityIssues:
  React.FC<
    TalentDataQualityIssuesProps
  > = ({
    summary,
    staleDays,
    onOpenIssue,
  }) => {
    return (
      <>
        <div
          style={{
            marginBottom: 12,
          }}
        >
          <Title
            level={4}
            style={{
              marginBottom: 2,
            }}
          >
            Vấn đề cần chú ý
          </Title>

          <Text type="secondary">
            Các nhóm có thể trùng
            nhân sự vì mỗi hồ sơ có
            thể tồn tại nhiều vấn đề
            dữ liệu cùng lúc.
          </Text>
        </div>

        <Row
          gutter={[
            16,
            16,
          ]}
        >
          <Col
            xs={24}
            md={12}
          >
            <IssueCard
              title="Chưa có kỹ năng"
              description="Hồ sơ chưa có UserSkill hợp lệ."
              count={
                summary
                  ?.employeesWithoutSkills ??
                0
              }
              icon={
                <WarningOutlined />
              }
              onClick={() =>
                onOpenIssue(
                  'WITHOUT_SKILLS',
                )
              }
            />
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <IssueCard
              title="Chưa có minh chứng được duyệt"
              description="Nhân sự chưa có minh chứng năng lực được duyệt."
              count={
                summary
                  ?.employeesWithoutApprovedEvidence ??
                0
              }
              icon={
                <FileSearchOutlined />
              }
              onClick={() =>
                onOpenIssue(
                  'WITHOUT_APPROVED_EVIDENCE',
                )
              }
            />
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <IssueCard
              title="Minh chứng đang chờ duyệt"
              description={`${summary?.totalPendingEvidences ?? 0} minh chứng đang chờ duyệt.`}
              count={
                summary
                  ?.employeesWithPendingEvidence ??
                0
              }
              icon={
                <ClockCircleOutlined />
              }
              onClick={() =>
                onOpenIssue(
                  'PENDING_EVIDENCE',
                )
              }
            />
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <IssueCard
              title="Hồ sơ lâu chưa cập nhật"
              description={`Dữ liệu năng lực không được cập nhật trong hơn ${staleDays} ngày.`}
              count={
                summary
                  ?.staleProfiles ??
                0
              }
              icon={
                <CheckCircleOutlined />
              }
              onClick={() =>
                onOpenIssue(
                  'STALE_PROFILE',
                )
              }
            />
          </Col>
        </Row>
      </>
    );
  };

export default TalentDataQualityIssues;