import { useEffect, useMemo, useState } from "react";
import {
    Avatar,
    Breadcrumb,
    Button,
    Card,
    Col,
    Empty,
    Flex,
    Input,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
    message,
} from "antd";
import type { TableProps } from "antd";
import {
    AppstoreOutlined,
    CalendarOutlined,
    ReloadOutlined,
    SearchOutlined,
    TagsOutlined,
    ThunderboltOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { callFetchSkills } from "../../api";

const { Title, Text, Paragraph } = Typography;

type SkillCreator = {
    id: string;
    email: string;
};

type SkillItem = {
    id: string;
    name: string;
    description: string;
    createdBy: SkillCreator | string;
    updatedBy: SkillCreator | null;
    deletedBy: SkillCreator | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    isDeleted: boolean;
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 40];

const safeText = (value?: string | null) => value ?? "";

const formatDateTime = (value?: string | null) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const getCreatorEmail = (createdBy: SkillItem["createdBy"]) => {
    if (typeof createdBy === "string") return createdBy;
    return createdBy?.email ?? "N/A";
};

const getSkillInitials = (name: string) => {
    const normalized = name.trim();
    if (!normalized) return "SK";

    return normalized
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
};

const getAvatarColor = (name: string) => {
    const palette = ["#1677ff", "#13c2c2", "#722ed1", "#fa8c16", "#eb2f96", "#389e0d"];
    const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return palette[sum % palette.length];
};

const SkillPage = () => {
    const [skills, setSkills] = useState<SkillItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [total, setTotal] = useState(0);
    const [sortQuery, setSortQuery] = useState("sort=name");

    const fetchSkills = async (page = current, size = pageSize, search = searchText, sort = sortQuery) => {
        setLoading(true);
        try {
            let query = `current=${page}&pageSize=${size}`;

            if (sort) {
                query += `&${sort}`;
            }

            if (search.trim()) {
                query += `&name=${encodeURIComponent(search.trim())}`;
            }

            const res = await callFetchSkills(query);
            if (res?.data) {
                setSkills((res.data.result ?? []) as SkillItem[]);
                const meta: any = res.data.meta;
                setTotal(meta?.total ?? 0);
                setCurrent(meta?.currentPage ?? meta?.current ?? page);
                setPageSize(meta?.pageSize ?? size);
            }
        } catch (error) {
            message.error("Không thể tải danh sách skills.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    const stats = useMemo(() => {
        const active = skills.filter((item) => !item.isDeleted).length;
        const deleted = skills.filter((item) => item.isDeleted).length;
        const hasDescription = skills.filter((item) => safeText(item.description).trim()).length;

        return { active, deleted, hasDescription };
    }, [skills]);

    const handleSearch = () => {
        fetchSkills(1, pageSize, searchText, sortQuery);
    };

    const handleRefresh = () => {
        setSearchText("");
        setSortQuery("sort=name");
        fetchSkills(1, pageSize, "", "sort=name");
    };

    const handleChangePage = (nextPage: number, nextPageSize: number) => {
        setCurrent(nextPage);
        setPageSize(nextPageSize);
        fetchSkills(nextPage, nextPageSize, searchText, sortQuery);
    };

    const columns: TableProps<SkillItem>["columns"] = [
        {
            title: "SKILL",
            dataIndex: "name",
            key: "name",
            render: (name: string, record) => (
                <Space size={12} align="start">
                    <Avatar
                        size={44}
                        style={{
                            backgroundColor: getAvatarColor(name),
                            fontWeight: 700,
                        }}
                    >
                        {getSkillInitials(name)}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.id}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: "MÔ TẢ",
            dataIndex: "description",
            key: "description",
            render: (description: string) => (
                <Text ellipsis={{ tooltip: description }} style={{ display: "inline-block", maxWidth: 460 }}>
                    {description || "Chưa có mô tả"}
                </Text>
            ),
        },
        {
            title: "NGƯỜI TẠO",
            dataIndex: "createdBy",
            key: "createdBy",
            render: (createdBy: SkillItem["createdBy"]) => (
                <Space size={8}>
                    <UserOutlined style={{ color: "#1677ff" }} />
                    <span>{getCreatorEmail(createdBy)}</span>
                </Space>
            ),
        },
        {
            title: "CẬP NHẬT",
            dataIndex: "updatedAt",
            key: "updatedAt",
            render: (updatedAt: string) => (
                <Space size={8}>
                    <CalendarOutlined style={{ color: "#8c8c8c" }} />
                    <span>{formatDateTime(updatedAt)}</span>
                </Space>
            ),
        },
        {
            title: "TRẠNG THÁI",
            dataIndex: "isDeleted",
            key: "isDeleted",
            align: "center",
            render: (isDeleted: boolean) => (
                <Tag color={isDeleted ? "red" : "green"} bordered={false}>
                    {isDeleted ? "Đã ẩn" : "Đang hoạt động"}
                </Tag>
            ),
        },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Breadcrumb
                items={[
                    { title: <Link to="/developer">Developer</Link> },
                    { title: "Skills" },
                ]}
            />

            <Card
                bordered={false}
                style={{
                    background:
                        "radial-gradient(circle at top left, rgba(22,119,255,0.18), transparent 35%), linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
                    overflow: "hidden",
                }}
            >
                <Flex justify="space-between" gap={16} wrap="wrap" align="flex-start">
                    <div style={{ maxWidth: 760 }}>
                        <Space size={10} align="center">
                            <TagsOutlined style={{ fontSize: 18, color: "#1677ff" }} />
                            <Text strong style={{ letterSpacing: 0.6, textTransform: "uppercase" }}>
                                Skill Library
                            </Text>
                        </Space>
                        <Title level={2} style={{ marginTop: 10, marginBottom: 8 }}>
                            Quản lý Skills bằng Ant Design
                        </Title>
                        <Paragraph style={{ marginBottom: 0, maxWidth: 680, color: "#475467" }}>
                            Trang này hiển thị danh sách kỹ năng từ backend, kèm người tạo, thời gian cập nhật,
                            trạng thái và hỗ trợ tìm kiếm nhanh.
                        </Paragraph>
                    </div>

                    <Space wrap align="start">
                        <Input
                            allowClear
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onPressEnter={handleSearch}
                            placeholder="Tìm theo tên skill..."
                            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                            style={{ width: 280 }}
                        />
                        <Select
                            value={sortQuery}
                            onChange={setSortQuery}
                            style={{ width: 170 }}
                            options={[
                                { label: "Tên A-Z", value: "sort=name" },
                                { label: "Tên Z-A", value: "sort=-name" },
                                { label: "Mới nhất", value: "sort=-updatedAt" },
                                { label: "Cũ nhất", value: "sort=updatedAt" },
                            ]}
                        />
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                            Tìm kiếm
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                            Làm mới
                        </Button>
                    </Space>
                </Flex>
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ height: "100%" }}>
                        <Statistic title="Tổng skills" value={total} prefix={<AppstoreOutlined />} valueStyle={{ color: "#1677ff" }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ height: "100%" }}>
                        <Statistic title="Đang hiển thị" value={skills.length} prefix={<ThunderboltOutlined />} valueStyle={{ color: "#13c2c2" }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ height: "100%" }}>
                        <Statistic title="Có mô tả" value={stats.hasDescription} prefix={<TagsOutlined />} valueStyle={{ color: "#722ed1" }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ height: "100%" }}>
                        <Statistic title="Đã ẩn" value={stats.deleted} prefix={<TagsOutlined />} valueStyle={{ color: "#ff4d4f" }} />
                    </Card>
                </Col>
            </Row>

            <Card
                bordered={false}
                title="Danh sách kỹ năng"
                extra={<Text type="secondary">Trang {current} / {Math.max(Math.ceil(total / pageSize), 1)}</Text>}
            >
                <Table
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={skills}
                    pagination={{
                        current,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
                        showTotal: (count) => `Tổng ${count} skills`,
                        onChange: handleChangePage,
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                description={
                                    searchText
                                        ? "Không tìm thấy skill nào phù hợp với từ khóa này."
                                        : "Chưa có dữ liệu skills."
                                }
                            />
                        ),
                    }}
                />
            </Card>
        </div>
    );
};

export default SkillPage;