import React, { useCallback, useEffect, useState } from 'react';
import {
    Button, Flex, Form, message, Typography,
} from 'antd';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { callFetchUsers } from '../../api/index';
import {
    hrReviewsApi,
    type CreateReviewCyclePaylod,
    type GetReviewRecordsParams,
    type ReviewRecordItem,
    type ReviewRecordStats,
    type ReviewRecordStatus,
} from '../../api/hrReviews';
import ReviewStatsSection from '../../components/hr/reviews/ReviewStatsSection';
import ReviewTableSection from '../../components/hr/reviews/ReviewTableSection';
import CreateReviewCycleModal, {
    type CreateReviewCycleFormValues,
} from '../../components/hr/reviews/CreateReviewCycleModal';

import ReviewScoreModal, {
    type ReviewScoreFormValues,
} from '../../components/hr/reviews/ReviewScoreModal';
import ReviewDetailDrawer from '../../components/hr/reviews/ReviewDetailDrawer';

const { Title, Text } = Typography;

// ─── Main Component ──────────────────────────────────────────────────────────

const ReviewConsole: React.FC = () => {
    // ── State ────────────────────────────────────────────────────────────────
    const [records, setRecords] = useState<ReviewRecordItem[]>([]);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    // Số liệu tổng hợp từ server — phản ánh TOÀN BỘ database, không phụ thuộc vào trang hiện tại
    const [cardStats, setCardStats] = useState<ReviewRecordStats>({ total: 0, pending: 0, inReview: 0, completed: 0 });
    const [statsLoading, setStatsLoading] = useState(false);
    // State cho Modal tạo kỳ đánh giá
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm] =
        Form.useForm<CreateReviewCycleFormValues>();
    // State cho Drawer xem chi tiết
    const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
    const [detailData, setDetailData] = useState<ReviewRecordItem | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    // State cho Select danh sách nhân viên trong Modal tạo kỳ đánh giá
    const [employeeOptions, setEmployeeOptions] = useState<{ label: string; value: string }[]>([]);
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);
    // Tham số query — thay đổi state này sẽ trigger useEffect fetch lại
    const [queryParams, setQueryParams] = useState<GetReviewRecordsParams>({
        page: 1,
        limit: 10,
    });
    // Tăng key này để force re-fetch sau khi approve/reject thành công
    const [refreshKey, setRefreshKey] = useState(0);

    // ── State cho Modal chấm điểm (HR Scoring Modal) ─────────────────────────
    const [isScoringModalVisible, setIsScoringModalVisible] = useState(false);
    const [isSubmittingScore, setIsSubmittingScore] = useState(false);
    const [scoringRecord, setScoringRecord] = useState<ReviewRecordItem | null>(null);
    const [scoringForm] =
        Form.useForm<ReviewScoreFormValues>();
    // ── Fetch danh sách records (phân trang) ─────────────────────────────────
    const fetchRecords = useCallback(async () => {
        try {
            const res = await hrReviewsApi.getRecords(queryParams);
            const payload = (res as any)?.data;
            if (payload) {
                setRecords(payload.result ?? []);
            }
        } catch (err: any) {
            message.error(err?.message ?? 'Không thể tải danh sách đánh giá');
        }
    }, [queryParams]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Fetch số liệu tổng hợp cho stat cards (toàn bộ DB) ──────────────────
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await hrReviewsApi.getStats();
            const payload = (res as any)?.data;
            if (payload) setCardStats(payload);
        } catch {
            // Lỗi stats không cần thông báo nổi bật — giữ giá trị cũ
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // fetchRecords chạy lại khi queryParams hoặc refreshKey thay đổi
    useEffect(() => { fetchRecords(); }, [fetchRecords, refreshKey]);
    // fetchStats chạy lần đầu và sau mỗi action thành công (refreshKey thay đổi)
    useEffect(() => { fetchStats(); }, [fetchStats, refreshKey]);

    // ── Fetch danh sách nhân viên cho Select ───────────────────────────────
    const fetchEmployeeOptions = useCallback(async () => {
        if (employeeOptions.length > 0) return; // Cache: chỉ fetch một lần
        setIsFetchingUsers(true);
        try {
            const res = await callFetchUsers('current=1&pageSize=200&populate=role');
            const users: any[] = (res as any)?.data?.result ?? [];
            setEmployeeOptions(
                users.map((u: any) => ({
                    label: u.fullName ? `${u.fullName} (${u.email})` : u.email,
                    value: u.id,
                }))
            );
        } catch {
            // Không block Modal nếu fetch user thất bại
        } finally {
            setIsFetchingUsers(false);
        }
    }, [employeeOptions.length]);

    // Fetch danh sách user khi Modal tạo kỳ được mở
    useEffect(() => {
        if (isCreateModalVisible) fetchEmployeeOptions();
    }, [isCreateModalVisible, fetchEmployeeOptions]);



    // ── Action handlers (theo state machine: PENDING → IN_REVIEW → COMPLETED) ───
    /** Mở Drawer chi tiết: fetch record theo id rồi hiển thị */
    const handleOpenDetail = async (record: ReviewRecordItem) => {
        setDetailData(null);
        setIsDetailDrawerVisible(true);
        setIsDetailLoading(true);
        try {
            const res = await hrReviewsApi.getRecordDetail(record.id);
            const payload = (res as any)?.data;
            if (payload) setDetailData(payload);
        } catch (err: any) {
            message.error(err?.message ?? 'Không thể tải chi tiết bản ghi');
            setIsDetailDrawerVisible(false);
        } finally {
            setIsDetailLoading(false);
        }
    };

    /** Xử lý submit form tạo kỳ đánh giá mới */
    const handleCreateCycle = async () => {
        try {
            const values = await createForm.validateFields();
            setIsCreating(true);
            const [start, end] = values.dateRange;
            const payload: CreateReviewCyclePaylod = {
                name: values.name.trim(),
                startDate: start.format('YYYY-MM-DD'),
                endDate: end.format('YYYY-MM-DD'),
                employeeIds: values.employeeIds?.length ? values.employeeIds : undefined,
            };
            await hrReviewsApi.createCycle(payload);
            const recordCount = payload.employeeIds?.length ?? 0;
            message.success(
                `Đã tạo kỳ đánh giá "${payload.name}" thành công` +
                (recordCount > 0 ? ` và gán ${recordCount} nhân viên!` : '!')
            );
            setIsCreateModalVisible(false);
            createForm.resetFields();
            setRefreshKey(k => k + 1); // trigger re-fetch records + stats
        } catch (err: any) {
            // Lỗi validateFields sẽ không có message — bỏ qua
            if (err?.message) message.error(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    /** Nút 'Xét duyệt': chuyển từ PENDING → IN_REVIEW */
    const handleMoveToReview = async (record: ReviewRecordItem) => {
        setApprovingId(record.id);
        try {
            await hrReviewsApi.updateRecordStatus(record.id, { status: 'IN_REVIEW' });
            message.success(`Đã chuyển sang xét duyệt: ${record.employee?.fullName ?? 'nhân viên'}`);
            setRefreshKey(k => k + 1);
        } catch (err: any) {
            message.error(err?.message ?? 'Thao tác thất bại, vui lòng thử lại');
        } finally {
            setApprovingId(null);
        }
    };

    /** Nút 'Hoàn tất': chuyển từ IN_REVIEW → COMPLETED */
    const handleComplete = async (record: ReviewRecordItem) => {
        // ── Frontend guard: yêu cầu finalScore trước khi COMPLETED ──
        if (record.finalScore === null || record.finalScore === undefined) {
            message.warning('Vui lòng nhập điểm chốt cuối cùng trước khi Hoàn tất đánh giá!');
            return;
        }
        setApprovingId(record.id);
        try {
            await hrReviewsApi.updateRecordStatus(record.id, { status: 'COMPLETED' });
            message.success('Đánh giá đã hoàn tất và phần thưởng đã được xử lý.');
            setRefreshKey(k => k + 1);
        } catch (err: any) {
            message.error(err?.message ?? 'Thao tác thất bại, vui lòng thử lại');
        } finally {
            setApprovingId(null);
        }
    };

    /** Mở Modal chấm điểm cho HR — prefill bằng giá trị hiện tại của record */
    const handleOpenScoreModal = (record: ReviewRecordItem) => {
        setScoringRecord(record);
        scoringForm.setFieldsValue({
            tempScore: record.tempScore ?? undefined,
            reviewerNote: record.reviewerNote ?? undefined,
            finalScore: record.finalScore ?? undefined,
        });
        setIsScoringModalVisible(true);
    };

    /** Submit Modal chấm điểm — chỉ gửi finalScore (HR role) */
    const handleSubmitScore = async () => {
        if (!scoringRecord) return;
        try {
            const values = await scoringForm.validateFields();
            setIsSubmittingScore(true);
            await hrReviewsApi.updateScore(scoringRecord.id, {
                finalScore: values.finalScore,
            });
            message.success(`Đã lưu điểm chốt cho: ${scoringRecord.employee?.fullName ?? 'nhân viên'}`);
            setIsScoringModalVisible(false);
            scoringForm.resetFields();
            setScoringRecord(null);
            setRefreshKey(k => k + 1);
        } catch (err: any) {
            if (err?.message) message.error(err.message);
        } finally {
            setIsSubmittingScore(false);
        }
    };

    // ── Server-side status filter handler ───────────────────────────────────
    /**
     * Được gọi trực tiếp từ sự kiện onChange của Select dropdown bên ngoài ActionTable.
     * Cập nhật queryParams → trigger useEffect → fetch lại data từ server.
     * KHÔNG đặt setState bên trong filterPredicates (vi phạm React render phase).
     */
    const handleStatusFilter = (status: ReviewRecordStatus | undefined) => {
        setQueryParams(prev => ({
            ...prev,
            page: 1, // reset về trang 1 khi đổi filter
            status,
        }));
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <div
                style={{
                    minHeight: '100%',
                    background:
                        'linear-gradient(180deg, #f8fafc 0%, #ffffff 420px)',
                    padding: '28px 28px 48px',
                    fontFamily: 'Inter, sans-serif',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: 1480,
                        margin: '0 auto',
                    }}
                >
                    {/* Header */}
                    {/* Header */}
                    <Flex
                        justify="space-between"
                        align="flex-start"
                        wrap="wrap"
                        gap={20}
                        style={{ marginBottom: 24 }}
                    >
                        <div>
                            <Text
                                style={{
                                    display: 'block',
                                    marginBottom: 4,
                                    color: '#2563eb',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Đánh giá hiệu suất
                            </Text>

                            <Title
                                level={2}
                                style={{
                                    margin: 0,
                                    color: '#101828',
                                    fontSize: 28,
                                    lineHeight: 1.25,
                                    letterSpacing: '-0.025em',
                                }}
                            >
                                Quản lý kỳ đánh giá
                            </Title>

                            <Text
                                style={{
                                    display: 'block',
                                    marginTop: 6,
                                    color: '#667085',
                                    fontSize: 14,
                                }}
                            >
                                Theo dõi tiến độ đánh giá, điểm số và trạng thái của nhân sự.
                            </Text>
                        </div>

                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            style={{
                                height: 42,
                                padding: '0 18px',
                                borderRadius: 10,
                                fontWeight: 600,
                                boxShadow: '0 1px 2px rgba(16,24,40,0.08)',
                            }}
                            onClick={() => setIsCreateModalVisible(true)}
                        >
                            Tạo kỳ đánh giá
                        </Button>
                    </Flex>
                    <ReviewStatsSection
                        stats={cardStats}
                        loading={statsLoading}
                    />
                    <ReviewTableSection
                        records={records}
                        approvingId={approvingId}
                        onOpenDetail={handleOpenDetail}
                        onMoveToReview={handleMoveToReview}
                        onOpenScore={handleOpenScoreModal}
                        onComplete={handleComplete}
                        onStatusChange={handleStatusFilter}
                    />
                </div>
            </div>

            <CreateReviewCycleModal
                open={isCreateModalVisible}
                loading={isCreating}
                form={createForm}
                employeeOptions={employeeOptions}
                fetchingEmployees={isFetchingUsers}
                onSubmit={handleCreateCycle}
                onCancel={() => {
                    setIsCreateModalVisible(false);
                    createForm.resetFields();
                }}
            />

            <ReviewScoreModal
                open={isScoringModalVisible}
                loading={isSubmittingScore}
                record={scoringRecord}
                form={scoringForm}
                onSubmit={handleSubmitScore}
                onCancel={() => {
                    setIsScoringModalVisible(false);
                    scoringForm.resetFields();
                    setScoringRecord(null);
                }}
            />

            <ReviewDetailDrawer
                open={isDetailDrawerVisible}
                loading={isDetailLoading}
                record={detailData}
                onClose={() => {
                    setIsDetailDrawerVisible(false);
                    setDetailData(null);
                }}
            />
        </>
    );
};

export default ReviewConsole;
