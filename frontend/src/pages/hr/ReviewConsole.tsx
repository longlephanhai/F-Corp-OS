import React, { useCallback, useEffect, useState } from 'react';
import {
    Avatar, Button, Card, Col, DatePicker, Descriptions, Drawer, Flex, Form, Input, message,
    Modal, Progress, Row, Select, Skeleton, Space, Spin, Statistic, Tag,
    Tooltip, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    CheckCircleOutlined, ClockCircleOutlined,
    ExclamationCircleOutlined, EyeOutlined, FilterOutlined, PlusOutlined,
    TeamOutlined, TrophyOutlined,
} from '@ant-design/icons';
import ActionTable from '../../components/ui/ActionTable';
import { callFetchUsers } from '../../api/index';
import {
    hrReviewsApi,
    type CreateReviewCyclePaylod,
    type GetReviewRecordsParams,
    type ReviewRecordItem,
    type ReviewRecordStats,
    type ReviewRecordStatus,
} from '../../api/hrReviews';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Lấy 2 chữ cái đầu tên để làm Avatar initials */
const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Màu avatar nhất quán dựa trên hash của id */
const AVATAR_COLORS = ['#0057c2', '#266d00', '#7d5400', '#614000', '#5c0a83', '#ba1a1a', '#006874'];
const getAvatarColor = (id: string): string =>
    AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Status config (ánh xạ giá trị enum backend → UI) ────────────────────────

type UiStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED';

const STATUS_CONFIG: Record<UiStatus, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING:   { label: 'Chờ duyệt',      color: 'orange', icon: <ClockCircleOutlined /> },
    IN_REVIEW: { label: 'Đang xét duyệt', color: 'blue',   icon: <ExclamationCircleOutlined /> },
    COMPLETED: { label: 'Hoàn thành',     color: 'green',  icon: <CheckCircleOutlined /> },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const ScoreCell: React.FC<{ value: number | null }> = ({ value }) => {
    if (value === null || value === undefined) return <Text type="secondary">—</Text>;
    const color = value >= 85 ? '#52c41a' : value >= 70 ? '#faad14' : '#ff4d4f';
    return (
        <Flex vertical gap={2} style={{ minWidth: 90 }}>
            <Text strong style={{ color, fontSize: 13 }}>{Number(value).toFixed(1)}/100</Text>
            <Progress percent={Number(value)} size="small" showInfo={false} strokeColor={color} trailColor="#f0f0f0" />
        </Flex>
    );
};

// ─── Status filter options (dùng cho Select server-side bên ngoài ActionTable) ──
const STATUS_FILTER_OPTIONS = [
    { value: 'PENDING',   label: 'Chờ duyệt' },
    { value: 'IN_REVIEW', label: 'Đang xét duyệt' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
];

// ─── Main Component ──────────────────────────────────────────────────────────

const ReviewConsole: React.FC = () => {
    // ── State ────────────────────────────────────────────────────────────────
    const [records, setRecords] = useState<ReviewRecordItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    // Số liệu tổng hợp từ server — phản ánh TOÀN BỘ database, không phụ thuộc vào trang hiện tại
    const [cardStats, setCardStats] = useState<ReviewRecordStats>({ total: 0, pending: 0, inReview: 0, completed: 0 });
    const [statsLoading, setStatsLoading] = useState(false);
    // State cho Modal tạo kỳ đánh giá
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm] = Form.useForm<{
        name: string;
        dateRange: [any, any];
        description?: string;
        employeeIds?: string[];
    }>();
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

    // ── Fetch danh sách records (phân trang) ─────────────────────────────────
    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const res = await hrReviewsApi.getRecords(queryParams);
            const payload = (res as any)?.data;
            if (payload) {
                setRecords(payload.result ?? []);
            }
        } catch (err: any) {
            message.error(err?.message ?? 'Không thể tải danh sách đánh giá');
        } finally {
            setLoading(false);
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

    // ── Stat card values từ dữ liệu TOÀN BỘ database (endpoint /records/stats) ─
    const statCards = [
        { label: 'Tổng bản ghi',  value: cardStats.total,     icon: <TeamOutlined />,              color: '#0057c2', bg: '#e6f0ff' },
        { label: 'Hoàn thành',    value: cardStats.completed,  icon: <CheckCircleOutlined />,       color: '#266d00', bg: '#edffd6' },
        { label: 'Chờ duyệt',     value: cardStats.pending,    icon: <ClockCircleOutlined />,       color: '#b35c00', bg: '#fff3e0' },
        { label: 'Đang xét duyệt',value: cardStats.inReview,   icon: <ExclamationCircleOutlined />, color: '#ba1a1a', bg: '#ffecea' },
    ];

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
                name:        values.name.trim(),
                startDate:   start.format('YYYY-MM-DD'),
                endDate:     end.format('YYYY-MM-DD'),
                description: values.description?.trim() || undefined,
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

    // ── Columns definition ───────────────────────────────────────────────────
    const columns: ColumnsType<ReviewRecordItem> = [
        {
            title: 'Nhân viên', key: 'employee', fixed: 'left', width: 230,
            render: (_, r) => {
                const emp = r.employee;
                if (!emp) return <Text type="secondary">—</Text>;
                return (
                    <Flex align="center" gap={10}>
                        <Avatar style={{ background: getAvatarColor(emp.id), flexShrink: 0 }}>
                            {getInitials(emp.fullName)}
                        </Avatar>
                        <Flex vertical gap={0}>
                            <Text strong style={{ fontSize: 13 }}>{emp.fullName}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>{emp.email}</Text>
                        </Flex>
                    </Flex>
                );
            },
        },
        {
            title: 'Vị trí / Phòng ban', key: 'title', width: 180,
            render: (_, r) => (
                <Flex vertical gap={4}>
                    <Text style={{ fontSize: 13 }}>{r.employee?.title ?? '—'}</Text>
                    <Tag style={{ width: 'fit-content', fontSize: 11 }}>{r.employee?.role?.name ?? '—'}</Tag>
                </Flex>
            ),
        },
        {
            title: 'Chu kỳ đánh giá', key: 'cycle', width: 160,
            render: (_, r) => (
                <Flex vertical gap={2}>
                    <Text style={{ fontSize: 13 }}>{r.reviewCycle?.name ?? '—'}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{r.reviewCycle?.status ?? ''}</Text>
                </Flex>
            ),
        },
        {
            title: 'Điểm cuối (Final Score)', dataIndex: 'finalScore', key: 'finalScore',
            width: 170, align: 'center',
            render: (v: number | null) => <ScoreCell value={v} />,
            sorter: (a, b) => (a.finalScore ?? -1) - (b.finalScore ?? -1),
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 140,
            render: (v: UiStatus) => {
                const cfg = STATUS_CONFIG[v] ?? { label: v, color: 'default', icon: null };
                return (
                    <Tag icon={cfg.icon} color={cfg.color} style={{ borderRadius: 999, padding: '2px 10px', fontWeight: 500 }}>
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Hành động', key: 'actions', width: 190, align: 'right', fixed: 'right',
            render: (_, r) => (
                <Space size={6}>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            style={{ padding: 0 }}
                            onClick={() => handleOpenDetail(r)}
                        >
                            Chi tiết
                        </Button>
                    </Tooltip>

                    {/* Nút 'Xét duyệt': chỉ hiển thị khi status === PENDING */}
                    {r.status === 'PENDING' && (
                        <Tooltip title="Chuyển sang giai đoạn xét duyệt">
                            <Button
                                type="primary"
                                size="small"
                                icon={<ExclamationCircleOutlined />}
                                loading={approvingId === r.id}
                                onClick={() => handleMoveToReview(r)}
                                style={{ borderRadius: 6, fontSize: 12 }}
                            >
                                Xét duyệt
                            </Button>
                        </Tooltip>
                    )}

                    {/* Nút 'Hoàn tất': chỉ hiển thị khi status === IN_REVIEW */}
                    {r.status === 'IN_REVIEW' && (
                        <Tooltip title="Xác nhận hoàn tất đánh giá">
                            <Button
                                size="small"
                                icon={<CheckCircleOutlined />}
                                loading={approvingId === r.id}
                                onClick={() => handleComplete(r)}
                                style={{
                                    borderRadius: 6, fontSize: 12,
                                    background: '#52c41a', borderColor: '#52c41a', color: '#fff',
                                }}
                            >
                                Hoàn tất
                            </Button>
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

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
        <div style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0, letterSpacing: '-0.02em' }}>Quản lý Kỳ Đánh Giá &amp; KPI</Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>Dữ liệu thực từ hệ thống backend</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    style={{ borderRadius: 8, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,87,194,0.25)' }}
                    onClick={() => setIsCreateModalVisible(true)}
                >
                    Tạo kỳ đánh giá mới
                </Button>
            </Flex>

            {/* Stat Cards — số liệu lấy từ /records/stats, phản ánh toàn bộ database */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {statCards.map(s => (
                    <Col xs={12} sm={12} md={6} key={s.label}>
                        <Card
                            bordered={false}
                            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}
                            styles={{ body: { padding: '16px 20px' } }}
                        >
                            <Flex align="center" gap={12}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10, background: s.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, color: s.color, flexShrink: 0,
                                }}>
                                    {s.icon}
                                </div>
                                {statsLoading
                                    ? <Skeleton.Input active style={{ width: 80 }} size="small" />
                                    : <Statistic
                                        title={<Text style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</Text>}
                                        value={s.value}
                                        valueStyle={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1.2 }}
                                    />
                                }
                            </Flex>
                            <Progress
                                percent={cardStats.total > 0 ? Math.round((s.value / cardStats.total) * 100) : 0}
                                size="small"
                                showInfo={false}
                                strokeColor={s.color}
                                trailColor="#f0f0f0"
                                style={{ marginTop: 10 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Server-side Status Filter — đặt bên ngoài ActionTable để tránh anti-pattern
                 gọi setState bên trong filterPredicates (vi phạm React render phase) */}
            <Flex justify="flex-end" style={{ marginBottom: 4 }}>
                <Select
                    allowClear
                    placeholder="Trạng thái: Tất cả"
                    suffixIcon={<FilterOutlined />}
                    style={{ width: 200 }}
                    options={STATUS_FILTER_OPTIONS}
                    onChange={(value: ReviewRecordStatus | undefined) => handleStatusFilter(value)}
                    onClear={() => handleStatusFilter(undefined)}
                />
            </Flex>

            {/* Data Table */}
            <ActionTable<ReviewRecordItem>
                columns={columns}
                dataSource={records}
                rowKey="id"
                scrollX={900}
                searchPlaceholder="Tìm kiếm nhân viên..."
                onSearch={(r, q) => {
                    const term = q.toLowerCase();
                    return (
                        r.employee?.fullName?.toLowerCase().includes(term) ||
                        r.employee?.email?.toLowerCase().includes(term) ||
                        false
                    );
                }}
                tableTitle={
                    <Flex align="center" gap={8}>
                        <TrophyOutlined style={{ color: '#0057c2' }} />
                        <Text strong style={{ fontSize: 15 }}>Danh sách đánh giá</Text>
                    </Flex>
                }
            />
        </div>

        {/* ── Modal: Tạo kỳ đánh giá mới ─────────────────────────────────── */}
        <Modal
            title={
                <Flex align="center" gap={8}>
                    <PlusOutlined style={{ color: '#0057c2' }} />
                    <span style={{ fontWeight: 600, fontSize: 16 }}>Tạo kỳ đánh giá mới</span>
                </Flex>
            }
            open={isCreateModalVisible}
            onCancel={() => {
                setIsCreateModalVisible(false);
                createForm.resetFields();
            }}
            onOk={handleCreateCycle}
            okText="Tạo ngay"
            cancelText="Hủy"
            confirmLoading={isCreating}
            okButtonProps={{ style: { borderRadius: 6 } }}
            cancelButtonProps={{ style: { borderRadius: 6 } }}
            width={520}
            destroyOnClose
        >
            <Form
                form={createForm}
                layout="vertical"
                style={{ marginTop: 16 }}
                requiredMark={false}
            >
                <Form.Item
                    name="name"
                    label={<Text strong>Tên kỳ đánh giá</Text>}
                    rules={[
                        { required: true, message: 'Vui lòng nhập tên kỳ đánh giá' },
                        { max: 255, message: 'Tên không được vượt quá 255 ký tự' },
                    ]}
                >
                    <Input
                        placeholder="Ví dụ: Đánh giá năng lực Q3/2026"
                        size="large"
                        style={{ borderRadius: 8 }}
                    />
                </Form.Item>

                <Form.Item
                    name="dateRange"
                    label={<Text strong>Thời gian kỳ đánh giá</Text>}
                    rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu và kết thúc' }]}
                >
                    <RangePicker
                        size="large"
                        style={{ width: '100%', borderRadius: 8 }}
                        format="DD/MM/YYYY"
                        placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                        disabledDate={(current) => current && current.isBefore(new Date(), 'day')}
                    />
                </Form.Item>

                <Form.Item
                    name="employeeIds"
                    label={<Text strong>Nhân sự tham gia <Text type="secondary" style={{ fontWeight: 400 }}>(tùy chọn)</Text></Text>}
                >
                    <Select
                        mode="multiple"
                        placeholder="Chọn nhân viên tham gia kỳ đánh giá..."
                        options={employeeOptions}
                        loading={isFetchingUsers}
                        filterOption={(input, option) =>
                            (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        style={{ width: '100%', borderRadius: 8 }}
                        allowClear
                        maxTagCount="responsive"
                    />
                </Form.Item>

                <Form.Item
                    name="description"
                    label={<Text strong>Mô tả <Text type="secondary" style={{ fontWeight: 400 }}>(tùy chọn)</Text></Text>}
                >
                    <TextArea
                        placeholder="Mô tả ngắn về mục tiêu của kỳ đánh giá..."
                        rows={3}
                        maxLength={1000}
                        showCount
                        style={{ borderRadius: 8 }}
                    />
                </Form.Item>
            </Form>
        </Modal>

        {/* ── Drawer: Xem chi tiết bản ghi đánh giá ────────────────────────── */}
        <Drawer
            title={
                <Flex align="center" gap={8}>
                    <EyeOutlined style={{ color: '#0057c2' }} />
                    <span style={{ fontWeight: 600 }}>Chi tiết Đánh giá</span>
                </Flex>
            }
            placement="right"
            width={600}
            open={isDetailDrawerVisible}
            onClose={() => { setIsDetailDrawerVisible(false); setDetailData(null); }}
            destroyOnClose
        >
            {isDetailLoading ? (
                <Flex justify="center" align="center" style={{ height: 300 }}>
                    <Spin size="large" tip="Đang tải..." />
                </Flex>
            ) : detailData ? (
                <>
                    {/* ── Thông tin nhân viên ── */}
                    <Flex align="center" gap={14} style={{ marginBottom: 24, padding: '16px', background: '#f8faff', borderRadius: 12 }}>
                        <Avatar
                            size={56}
                            style={{ background: getAvatarColor(detailData.employee?.id ?? '0'), fontSize: 20, flexShrink: 0 }}
                        >
                            {detailData.employee ? getInitials(detailData.employee.fullName) : '?'}
                        </Avatar>
                        <Flex vertical gap={2}>
                            <Text strong style={{ fontSize: 16 }}>{detailData.employee?.fullName ?? '—'}</Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>{detailData.employee?.email ?? ''}</Text>
                            <Tag style={{ width: 'fit-content', marginTop: 2 }}>
                                {detailData.employee?.role?.name ?? detailData.employee?.title ?? '—'}
                            </Tag>
                        </Flex>
                    </Flex>

                    {/* ── Thông tin đánh giá ── */}
                    <Descriptions
                        bordered
                        column={1}
                        size="small"
                        labelStyle={{ fontWeight: 600, width: 170, background: '#fafafa' }}
                        contentStyle={{ background: '#fff' }}
                    >
                        <Descriptions.Item label="Tên kỳ đánh giá">
                            {detailData.reviewCycle?.name ?? '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái chu kỳ">
                            <Tag color="blue">{detailData.reviewCycle?.status ?? '—'}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày bắt đầu">
                            {detailData.reviewCycle?.startDate
                                ? new Date(detailData.reviewCycle.startDate).toLocaleDateString('vi-VN')
                                : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày kết thúc">
                            {detailData.reviewCycle?.endDate
                                ? new Date(detailData.reviewCycle.endDate).toLocaleDateString('vi-VN')
                                : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Điểm số (Final)">
                            {detailData.finalScore != null
                                ? <Text strong style={{ color: detailData.finalScore >= 85 ? '#52c41a' : detailData.finalScore >= 70 ? '#faad14' : '#ff4d4f' }}>
                                    {Number(detailData.finalScore).toFixed(1)} / 100
                                  </Text>
                                : <Text type="secondary">— Chưa có điểm</Text>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {(() => {
                                const cfg = STATUS_CONFIG[detailData.status as UiStatus] ?? { label: detailData.status, color: 'default', icon: null };
                                return <Tag icon={cfg.icon} color={cfg.color} style={{ borderRadius: 999, padding: '2px 10px', fontWeight: 500 }}>{cfg.label}</Tag>;
                            })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người tạo">
                            {detailData.createdAt
                                ? new Date(detailData.createdAt).toLocaleString('vi-VN')
                                : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cập nhật lần cuối">
                            {detailData.updatedAt
                                ? new Date(detailData.updatedAt).toLocaleString('vi-VN')
                                : '—'}
                        </Descriptions.Item>
                    </Descriptions>
                </>
            ) : (
                <Flex justify="center" align="center" style={{ height: 200 }}>
                    <Text type="secondary">Không tìm thấy dữ liệu</Text>
                </Flex>
            )}
        </Drawer>
        </>
    );
};

export default ReviewConsole;
