import React from 'react';
import { Flex, Typography } from 'antd';
import BenchTalentPoolView from '../../components/hr/talents/bench/BenchTalentPoolView';

const { Title, Text } = Typography;

const BenchForecast: React.FC = () => {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <Flex
        justify="space-between"
        align="flex-start"
        wrap="wrap"
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div>
          <Title level={3} style={{ margin: 0, letterSpacing: '-0.02em' }}>
            Nhân sự Bench
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Dữ liệu nhân sự Bench và mức độ sẵn sàng được tổng hợp trực tiếp từ
            hồ sơ năng lực hiện tại.
          </Text>
        </div>
      </Flex>

      <BenchTalentPoolView />
    </div>
  );
};

export default BenchForecast;
