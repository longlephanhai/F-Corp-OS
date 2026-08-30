import React from 'react';
import {
  Tabs,
  Typography,
} from 'antd';

import TalentDirectoryView from '../../components/hr/talents/TalentDirectoryView';
import SkillMatrixView from '../../components/hr/talents/SkillMatrixView';

const {
  Title,
  Text,
} = Typography;

const TalentManagement: React.FC =
  () => {
    return (
      <div
        style={{
          fontFamily:
            'Inter, sans-serif',
          color: '#1c1b1b',
        }}
      >
        <div
          style={{
            marginBottom: 20,
          }}
        >
          <Title
            level={3}
            style={{
              margin: 0,
              letterSpacing:
                '-0.02em',
            }}
          >
            Nhân sự & Năng lực
          </Title>

          <Text
            type="secondary"
            style={{
              fontSize: 14,
            }}
          >
            Theo dõi hồ sơ năng
            lực, ma trận kỹ năng
            và chất lượng dữ liệu
            nhân sự.
          </Text>
        </div>

        <Tabs
          defaultActiveKey="directory"
          items={[
            {
              key: 'directory',
              label:
                'Hồ sơ nhân sự',
              children: (
                <TalentDirectoryView />
              ),
            },
            {
              key: 'skill-matrix',
              label:
                'Ma trận kỹ năng',
              children: (
                <SkillMatrixView />
              ),
            },
          ]}
        />
      </div>
    );
  };

export default TalentManagement;