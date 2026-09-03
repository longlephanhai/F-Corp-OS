import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Card,
  Col,
  Flex,
  Progress,
  Row,
  Skeleton,
  Tag,
  Typography,
  message,
} from 'antd';

import {
  CheckCircleOutlined,
  DatabaseOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';

import {
  hrTalentsApi,
  type HrSkillSupplySummary,
} from '../../../api/hrTalents';

const {
  Text,
  Title,
} = Typography;

interface SelectedSkill {
  skillId: string;
  name: string;
}

interface SkillSupplyInsightsProps {
  onViewSkill?: (
    skill: SelectedSkill,
  ) => void;
}

const SkillSupplyInsights: React.FC<
  SkillSupplyInsightsProps
> = ({
  onViewSkill,
}) => {
  const [
    summary,
    setSummary,
  ] = useState<
    HrSkillSupplySummary | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const loadSummary =
    useCallback(async () => {
      setLoading(true);

      try {
        const response =
          await hrTalentsApi.getSkillSupplySummary();

        setSummary(
          response?.data ?? null,
        );
      } catch (error) {
        console.error(
          'Không tải được Skill Supply Summary',
          error,
        );

        message.error(
          'Không thể tải tổng quan nguồn cung kỹ năng.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (
    loading &&
    !summary
  ) {
    return (
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <Skeleton active />
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const insightCards = [
    {
      title:
        'Danh mục kỹ năng',

      value:
        summary.catalog
          .totalSkills,

      description:
        'Tổng skill trong catalog',

      icon:
        <DatabaseOutlined />,
    },

    {
      title:
        'Có nguồn cung',

      value:
        summary.catalog
          .skillsWithSupply,

      description:
        `${summary.catalog.zeroSupplySkills} skill chưa có nhân sự`,

      icon:
        <TeamOutlined />,
    },

    {
      title:
        'Có nguồn lực Bench',

      value:
        summary.catalog
          .skillsWithBenchSupply,

      description:
        'Skill đang có nhân sự Bench',

      icon:
        <UserSwitchOutlined />,
    },

    {
      title:
        'Tỷ lệ kỹ năng có minh chứng',

      value:
        `${summary.coverage.verificationRate}%`,

      description:
        `${summary.coverage.verifiedEmployeeSkillPairs}/${summary.coverage.employeeSkillPairs} cặp nhân sự-kỹ năng`,

      icon:
        <CheckCircleOutlined />,
    },
  ];

  return (
    <div
      style={{
        marginBottom: 20,
      }}
    >
      <Row
        gutter={[
          16,
          16,
        ]}
      >
        {insightCards.map(
          (item) => (
            <Col
              xs={24}
              sm={12}
              xl={6}
              key={
                item.title
              }
            >
              <Card
                bordered={false}
                style={{
                  height:
                    '100%',
                  borderRadius:
                    12,
                  boxShadow:
                    '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={12}
                >
                  <div>
                    <Text
                      type="secondary"
                    >
                      {
                        item.title
                      }
                    </Text>

                    <Title
                      level={3}
                      style={{
                        margin:
                          '6px 0 2px',
                      }}
                    >
                      {
                        item.value
                      }
                    </Title>

                    <Text
                      type="secondary"
                      style={{
                        fontSize:
                          12,
                      }}
                    >
                      {
                        item.description
                      }
                    </Text>
                  </div>

                  <div
                    style={{
                      fontSize:
                        24,
                    }}
                  >
                    {
                      item.icon
                    }
                  </div>
                </Flex>
              </Card>
            </Col>
          ),
        )}
      </Row>

      <Row
        gutter={[
          16,
          16,
        ]}
        style={{
          marginTop: 16,
        }}
      >
        <Col
          xs={24}
          lg={12}
        >
          <Card
            bordered={false}
            title="Kỹ năng có nguồn cung mạnh"
            style={{
              height:
                '100%',
              borderRadius:
                12,
              boxShadow:
                '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Flex
              vertical
              gap={14}
            >
              {summary
                .topSupplySkills
                .length === 0 ? (
                <Text type="secondary">
                  Chưa có dữ liệu.
                </Text>
              ) : (
                summary
                  .topSupplySkills
                  .map(
                    (
                      skill,
                      index,
                    ) => (
                      <Flex
                        key={
                          skill.skillId
                        }
                        justify="space-between"
                        align="center"
                        gap={12}
                      >
                        <Flex
                          align="center"
                          gap={8}
                        >
                          <Tag>
                            #
                            {index +
                              1}
                          </Tag>

                          <Text
                            strong
                            style={{
                              cursor:
                                'pointer',
                            }}
                            onClick={() =>
                              onViewSkill?.(
                                {
                                  skillId:
                                    skill.skillId,

                                  name:
                                    skill.name,
                                },
                              )
                            }
                          >
                            {
                              skill.name
                            }
                          </Text>
                        </Flex>

                        <Flex
                          gap={6}
                          wrap="wrap"
                          justify="flex-end"
                        >
                          <Tag color="blue">
                            {
                              skill.totalEmployees
                            }{' '}
                            nhân sự
                          </Tag>

                          <Tag color="green">
                            L4+:{' '}
                            {
                              skill.level4Plus
                            }
                          </Tag>
                        </Flex>
                      </Flex>
                    ),
                  )
              )}
            </Flex>
          </Card>
        </Col>

        <Col
          xs={24}
          lg={12}
        >
          <Card
            bordered={false}
            title="Cơ hội khai thác nguồn lực Bench"
            style={{
              height:
                '100%',
              borderRadius:
                12,
              boxShadow:
                '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Flex
              vertical
              gap={14}
            >
              {summary
                .topBenchSkills
                .length === 0 ? (
                <Text type="secondary">
                  Chưa có nguồn lực
                  Bench theo kỹ năng.
                </Text>
              ) : (
                summary
                  .topBenchSkills
                  .map(
                    (
                      skill,
                      index,
                    ) => (
                      <Flex
                        key={
                          skill.skillId
                        }
                        justify="space-between"
                        align="center"
                        gap={12}
                      >
                        <Flex
                          align="center"
                          gap={8}
                        >
                          <Tag>
                            #
                            {index +
                              1}
                          </Tag>

                          <Text
                            strong
                            style={{
                              cursor:
                                'pointer',
                            }}
                            onClick={() =>
                              onViewSkill?.(
                                {
                                  skillId:
                                    skill.skillId,

                                  name:
                                    skill.name,
                                },
                              )
                            }
                          >
                            {
                              skill.name
                            }
                          </Text>
                        </Flex>

                        <Flex
                          gap={6}
                          align="center"
                        >
                          <Tag color="orange">
                            Bench:{' '}
                            {
                              skill.benchEmployees
                            }
                          </Tag>

                          <Text
                            type="secondary"
                            style={{
                              fontSize:
                                12,
                            }}
                          >
                            /
                            {
                              skill.totalEmployees
                            }{' '}
                            tổng
                          </Text>
                        </Flex>
                      </Flex>
                    ),
                  )
              )}
            </Flex>
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{
          marginTop: 16,
          borderRadius: 12,
          boxShadow:
            '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <Flex
          vertical
          gap={10}
        >
          <Flex
            justify="space-between"
            align="center"
          >
            <Text strong>
              Chất lượng dữ liệu
              kỹ năng
            </Text>

            <Text strong>
              {
                summary.coverage
                  .verificationRate
              }
              %
            </Text>
          </Flex>

          <Progress
            percent={
              summary.coverage
                .verificationRate
            }
            showInfo={false}
          />

          <Flex
            gap={8}
            wrap="wrap"
          >
            <Tag color="green">
              Available:{' '}
              {
                summary.workforce
                  .availableSkillPairs
              }
            </Tag>

            <Tag color="blue">
              In Project:{' '}
              {
                summary.workforce
                  .inProjectSkillPairs
              }
            </Tag>

            <Tag color="orange">
              Bench:{' '}
              {
                summary.workforce
                  .benchSkillPairs
              }
            </Tag>
          </Flex>

          <Text
            type="secondary"
            style={{
              fontSize: 12,
            }}
          >
            Các số liệu trên là số
            cặp nhân sự-kỹ năng,
            không phải số nhân sự
            unique.
          </Text>
        </Flex>
      </Card>
    </div>
  );
};

export default SkillSupplyInsights;