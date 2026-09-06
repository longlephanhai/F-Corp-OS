import {
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';

import {
  InfoCircleOutlined,
} from '@ant-design/icons';

import type {
  TableProps,
} from 'antd';

import type {
  HrSkillSupplyRiskItem,
  HrSkillSupplyRiskLevel,
} from '../../../../api/hrTalents';

const {
  Text,
} = Typography;

interface SkillSupplyRiskTableProps {
  data:
    HrSkillSupplyRiskItem[];

  loading: boolean;

  page: number;

  pageSize: number;

  total: number;

  onPageChange: (
    page: number,
    pageSize: number,
  ) => void;
}

const riskConfig: Record<
  HrSkillSupplyRiskLevel,
  {
    label: string;
    color: string;
  }
> = {
  CRITICAL: {
    label: 'Nghiêm trọng',
    color: 'red',
  },

  HIGH: {
    label: 'Cao',
    color: 'orange',
  },

  MEDIUM: {
    label: 'Trung bình',
    color: 'gold',
  },

  LOW: {
    label: 'Thấp',
    color: 'green',
  },
};

const SkillSupplyRiskTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
}: SkillSupplyRiskTableProps) => {
  const columns:
    TableProps<HrSkillSupplyRiskItem>['columns'] =
      [
        {
          title: 'Kỹ năng',
          key: 'skill',
          width: 220,

          render: (_, record) => (
            <Space
              orientation="vertical"
              size={0}
            >
              <Text strong>
                {record.skill.name}
              </Text>

              {record.skill.description && (
                <Text
                  type="secondary"
                  ellipsis
                  style={{
                    maxWidth: 210,
                    fontSize: 12,
                  }}
                >
                  {record.skill.description}
                </Text>
              )}
            </Space>
          ),
        },

        {
          title: 'Nguồn cung',
          key: 'totalEmployees',
          width: 110,
          align: 'center',

          render: (_, record) => (
            <Text strong>
              {
                record.supply
                  .totalEmployees
              }
            </Text>
          ),
        },

        {
          title: 'Cấp độ 4+',
          key: 'level4Plus',
          width: 110,
          align: 'center',

          render: (_, record) =>
            record.supply.level4Plus,
        },

        {
          title: 'Đã xác minh',
          key: 'verificationRate',
          width: 170,

          render: (_, record) => (
            <Tooltip
              title={`${record.supply.verifiedEmployees}/${record.supply.totalEmployees} nhân sự có minh chứng được duyệt`}
            >
              <Progress
                percent={
                  record.supply
                    .verificationRate
                }
                size="small"
              />
            </Tooltip>
          ),
        },

        {
          title: (
            <Space size={4}>
              Có thể điều động

              <Tooltip
                title="Được tính từ nhân sự đang ở trạng thái sẵn sàng hoặc Bench. Chỉ số này không khẳng định nhân sự phù hợp với một dự án cụ thể."
              >
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          ),
          key: 'mobilizable',
          width: 150,
          align: 'center',

          render: (_, record) =>
            record.supply.available +
            record.supply.bench,
        },

        {
          title: 'Điểm rủi ro',
          key: 'riskScore',
          width: 115,
          align: 'center',

          render: (_, record) => (
            <Text strong>
              {record.risk.score}
              /100
            </Text>
          ),
        },

        {
          title: 'Mức rủi ro',
          key: 'riskLevel',
          width: 130,

          render: (_, record) => {
            const config =
              riskConfig[
                record.risk.level
              ];

            return (
              <Tooltip
                title={
                  record.risk.reasons
                    .length > 0
                    ? record.risk.reasons.join(
                        ' • ',
                      )
                    : 'Chưa ghi nhận yếu tố rủi ro đáng kể.'
                }
              >
                <Tag
                  color={
                    config.color
                  }
                >
                  {config.label}
                </Tag>
              </Tooltip>
            );
          },
        },
      ];

  return (
    <Table<HrSkillSupplyRiskItem>
      rowKey={(record) =>
        record.skill.id
      }
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{
        x: 1000,
      }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [
          10,
          20,
          50,
          100,
        ],
        showTotal: (value) =>
          `Tổng ${value} kỹ năng`,
        onChange:
          onPageChange,
      }}
    />
  );
};

export default SkillSupplyRiskTable;