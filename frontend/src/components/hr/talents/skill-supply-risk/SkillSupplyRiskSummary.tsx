import {
  Card,
  Col,
  Row,
  Statistic,
  Typography,
} from 'antd';

import type {
  HrSkillSupplyRiskSummary as RiskSummary,
} from '../../../../api/hrTalents';

const { Text } = Typography;

interface SkillSupplyRiskSummaryProps {
  summary: RiskSummary;
}

const SkillSupplyRiskSummary = ({
  summary,
}: SkillSupplyRiskSummaryProps) => {
  const items = [
    {
      title: 'Tổng kỹ năng',
      value: summary.totalSkills,
      note: 'Tổng kỹ năng được đánh giá',
    },
    {
      title: 'Nghiêm trọng',
      value: summary.critical,
      note: 'Nguồn cung cần ưu tiên theo dõi',
    },
    {
      title: 'Rủi ro cao',
      value: summary.high,
      note: 'Nguồn cung đang ở mức rủi ro cao',
    },
    {
      title: 'Chưa có nguồn cung',
      value: summary.zeroSupply,
      note: 'Chưa có nhân sự sở hữu kỹ năng',
    },
  ];

  return (
    <Row
      gutter={[16, 16]}
      style={{
        marginBottom: 20,
      }}
    >
      {items.map((item) => (
        <Col
          key={item.title}
          xs={24}
          sm={12}
          xl={6}
        >
          <Card
            variant="borderless"
            style={{
              height: '100%',
              borderRadius: 12,
              boxShadow:
                '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Statistic
              title={item.title}
              value={item.value}
            />

            <Text
              type="secondary"
              style={{
                fontSize: 12,
              }}
            >
              {item.note}
            </Text>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default SkillSupplyRiskSummary;