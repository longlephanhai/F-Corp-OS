import React, {
  useEffect,
  useState,
} from 'react';
import {
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Flex,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';

import {
  hrTalentsApi,
  type EmployeeTalentProfile,
  type TalentEvidenceStatus,
  type TalentWorkforceStatus,
} from '../../../api/hrTalents';

const {
  Text,
  Title,
} = Typography;

interface TalentProfileDrawerProps {
  open: boolean;

  employeeId: string | null;

  onClose: () => void;
}

const STATUS_META: Record<
  TalentWorkforceStatus,
  {
    label: string;
    color: string;
  }
> = {
  AVAILABLE: {
    label: 'Sẵn sàng',
    color: 'green',
  },

  IN_PROJECT: {
    label: 'Trong dự án',
    color: 'blue',
  },

  BENCH: {
    label: 'Bench',
    color: 'orange',
  },
};

const EVIDENCE_META: Record<
  TalentEvidenceStatus,
  {
    label: string;
    color: string;
  }
> = {
  APPROVED: {
    label: 'Đã duyệt',
    color: 'green',
  },

  PENDING: {
    label: 'Chờ duyệt',
    color: 'gold',
  },

  REJECTED: {
    label: 'Từ chối',
    color: 'red',
  },
};

const formatDate = (
  value?: string | null,
) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    'vi-VN',
  );
};

const TalentProfileDrawer: React.FC<
  TalentProfileDrawerProps
> = ({
  open,
  employeeId,
  onClose,
}) => {
  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    profile,
    setProfile,
  ] =
    useState<EmployeeTalentProfile | null>(
      null,
    );

  useEffect(() => {
    if (
      !open ||
      !employeeId
    ) {
      return;
    }

    let cancelled = false;

    const loadProfile =
      async () => {
        setLoading(true);

        try {
          const response =
            await hrTalentsApi.getByEmployeeId(
              employeeId,
            );

          if (cancelled) {
            return;
          }

          setProfile(
            response?.data ??
              null,
          );
        } catch (error) {
          console.error(
            'Không tải được Talent Profile',
            error,
          );

          if (!cancelled) {
            setProfile(null);

            message.error(
              'Không thể tải hồ sơ năng lực nhân sự.',
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    setProfile(null);

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    employeeId,
  ]);

  const employee =
    profile?.employee;

  const workforceStatus =
    employee
      ? STATUS_META[
          employee.status
        ]
      : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="large"
      destroyOnHidden
      title="Hồ sơ năng lực nhân sự"
    >
      <Spin
        spinning={loading}
      >
        {!loading &&
        !profile ? (
          <Empty
            description="Không có dữ liệu hồ sơ năng lực"
          />
        ) : null}

        {profile &&
        employee ? (
          <Flex
            vertical
            gap={20}
          >
            {/* ─────────────────────────
                Employee information
            ───────────────────────── */}
            <Card>
              <Flex
                justify="space-between"
                align="flex-start"
                gap={16}
                wrap="wrap"
              >
                <div>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                    }}
                  >
                    {
                      employee.fullName
                    }
                  </Title>

                  <Text type="secondary">
                    {
                      employee.title ||
                      'Chưa có chức danh'
                    }
                  </Text>
                </div>

                {workforceStatus && (
                  <Tag
                    color={
                      workforceStatus.color
                    }
                  >
                    {
                      workforceStatus.label
                    }
                  </Tag>
                )}
              </Flex>

              <Divider />

              <Descriptions
                column={1}
                size="small"
              >
                <Descriptions.Item label="Email">
                  {employee.email}
                </Descriptions.Item>

                <Descriptions.Item label="Vai trò">
                  {employee.role?.name ??
                    '—'}
                </Descriptions.Item>

                <Descriptions.Item label="Quản lý trực tiếp">
                  {employee.manager
                    ? `${employee.manager.fullName} (${employee.manager.email})`
                    : '—'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* ─────────────────────────
                Talent summary
            ───────────────────────── */}
            <Card
              title="Tổng quan năng lực"
            >
              <Descriptions
                column={{
                  xs: 1,
                  sm: 2,
                }}
                size="small"
              >
                <Descriptions.Item label="Tổng kỹ năng">
                  {
                    profile
                      .talentSummary
                      .totalSkills
                  }
                </Descriptions.Item>

                <Descriptions.Item label="Kỹ năng có evidence được duyệt">
                  {
                    profile
                      .talentSummary
                      .skillsWithApprovedEvidence
                  }
                </Descriptions.Item>

                <Descriptions.Item label="Evidence đã duyệt">
                  {
                    profile
                      .talentSummary
                      .approvedEvidences
                  }
                </Descriptions.Item>

                <Descriptions.Item label="Evidence chờ duyệt">
                  {
                    profile
                      .talentSummary
                      .pendingEvidences
                  }
                </Descriptions.Item>

                <Descriptions.Item label="Evidence bị từ chối">
                  {
                    profile
                      .talentSummary
                      .rejectedEvidences
                  }
                </Descriptions.Item>

                <Descriptions.Item label="Cập nhật năng lực gần nhất">
                  {formatDate(
                    profile
                      .talentSummary
                      .lastTalentDataUpdatedAt,
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* ─────────────────────────
                Skills
            ───────────────────────── */}
            <Card title="Kỹ năng">
              {profile.skills.length ===
              0 ? (
                <Empty
                  description="Nhân sự chưa có dữ liệu kỹ năng"
                  image={
                    Empty.PRESENTED_IMAGE_SIMPLE
                  }
                />
              ) : (
                <Flex
                  vertical
                  gap={12}
                >
                  {profile.skills.map(
                    (
                      userSkill,
                    ) => (
                      <Card
                        key={
                          userSkill.userSkillId
                        }
                        size="small"
                      >
                        <Flex
                          justify="space-between"
                          align="flex-start"
                          wrap="wrap"
                          gap={12}
                        >
                          <div>
                            <Flex
                              align="center"
                              gap={8}
                              wrap="wrap"
                            >
                              <Text strong>
                                {
                                  userSkill
                                    .skill
                                    .name
                                }
                              </Text>

                              <Tag color="blue">
                                Level{' '}
                                {
                                  userSkill.level
                                }
                              </Tag>

                              {userSkill.hasApprovedEvidence && (
                                <Tag color="green">
                                  Có bằng
                                  chứng đã
                                  duyệt
                                </Tag>
                              )}
                            </Flex>

                            <div
                              style={{
                                marginTop: 6,
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: 12,
                                }}
                              >
                                Kinh nghiệm:{' '}
                                {userSkill.years ===
                                  null
                                  ? '—'
                                  : `${userSkill.years} năm`}
                              </Text>
                            </div>

                            {userSkill.confidenceScore !==
                              null && (
                              <div>
                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: 12,
                                  }}
                                >
                                  Confidence
                                  score:{' '}
                                  {
                                    userSkill.confidenceScore
                                  }
                                </Text>
                              </div>
                            )}
                          </div>

                          <Flex
                            gap={6}
                            wrap="wrap"
                          >
                            <Tag color="green">
                              Approved:{' '}
                              {
                                userSkill
                                  .evidenceSummary
                                  .approved
                              }
                            </Tag>

                            <Tag color="gold">
                              Pending:{' '}
                              {
                                userSkill
                                  .evidenceSummary
                                  .pending
                              }
                            </Tag>

                            <Tag color="red">
                              Rejected:{' '}
                              {
                                userSkill
                                  .evidenceSummary
                                  .rejected
                              }
                            </Tag>
                          </Flex>
                        </Flex>

                        {userSkill.evidences
                          .length >
                          0 && (
                          <>
                            <Divider
                              style={{
                                margin:
                                  '12px 0',
                              }}
                            />

                            <Flex
                              vertical
                              gap={8}
                            >
                              {userSkill.evidences.map(
                                (
                                  evidence,
                                ) => {
                                  const meta =
                                    EVIDENCE_META[
                                      evidence
                                        .status
                                    ];

                                  return (
                                    <Flex
                                      key={
                                        evidence.id
                                      }
                                      justify="space-between"
                                      align="flex-start"
                                      gap={12}
                                      wrap="wrap"
                                    >
                                      <div>
                                        <Text
                                          style={{
                                            fontSize: 13,
                                          }}
                                        >
                                          {evidence.title ||
                                            evidence.type}
                                        </Text>

                                        <div>
                                          <Text
                                            type="secondary"
                                            style={{
                                              fontSize: 11,
                                            }}
                                          >
                                            {
                                              evidence.type
                                            }
                                            {' · '}
                                            {formatDate(
                                              evidence.createdAt,
                                            )}
                                          </Text>
                                        </div>
                                      </div>

                                      <Tag
                                        color={
                                          meta.color
                                        }
                                      >
                                        {
                                          meta.label
                                        }
                                      </Tag>
                                    </Flex>
                                  );
                                },
                              )}
                            </Flex>
                          </>
                        )}
                      </Card>
                    ),
                  )}
                </Flex>
              )}
            </Card>

            {/* ─────────────────────────
                Performance
            ───────────────────────── */}
            <Card title="Hiệu suất">
              <Descriptions
                column={{
                  xs: 1,
                  sm: 2,
                }}
                size="small"
              >
                <Descriptions.Item label="Tổng kỳ đánh giá">
                  {
                    profile
                      .performanceSummary
                      .totalReviews
                  }
                </Descriptions.Item>

                <Descriptions.Item label="Đã hoàn thành">
                  {
                    profile
                      .performanceSummary
                      .completedReviews
                  }
                </Descriptions.Item>

                <Descriptions.Item label="Điểm trung bình">
                  {profile
                    .performanceSummary
                    .averageFinalScore ??
                    '—'}
                </Descriptions.Item>

                <Descriptions.Item label="Điểm gần nhất">
                  {profile
                    .performanceSummary
                    .latestFinalScore ??
                    '—'}
                </Descriptions.Item>

                <Descriptions.Item label="Kỳ đánh giá gần nhất">
                  {profile
                    .performanceSummary
                    .latestReviewCycle
                    ?.name ?? '—'}
                </Descriptions.Item>
              </Descriptions>

              {profile
                .performanceHistory
                .length >
                0 && (
                <>
                  <Divider />

                  <Text strong>
                    Lịch sử đánh giá
                  </Text>

                  <Flex
                    vertical
                    gap={8}
                    style={{
                      marginTop: 12,
                    }}
                  >
                    {profile.performanceHistory.map(
                      (
                        review,
                      ) => (
                        <Flex
                          key={
                            review.id
                          }
                          justify="space-between"
                          align="center"
                          gap={12}
                          wrap="wrap"
                        >
                          <div>
                            <Text>
                              {review
                                .reviewCycle
                                ?.name ??
                                'Kỳ đánh giá'}
                            </Text>

                            <div>
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: 11,
                                }}
                              >
                                {
                                  review.status
                                }
                              </Text>
                            </div>
                          </div>

                          <Flex
                            gap={8}
                            align="center"
                          >
                            {review.tempScore !==
                              null && (
                              <Tag>
                                PM:{' '}
                                {
                                  review.tempScore
                                }
                              </Tag>
                            )}

                            {review.finalScore !==
                              null && (
                              <Tag color="blue">
                                Final:{' '}
                                {
                                  review.finalScore
                                }
                              </Tag>
                            )}
                          </Flex>
                        </Flex>
                      ),
                    )}
                  </Flex>
                </>
              )}
            </Card>
          </Flex>
        ) : null}
      </Spin>
    </Drawer>
  );
};

export default TalentProfileDrawer;