import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Card,
    Flex,
    Pagination,
    Select,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HistoryOutlined } from '@ant-design/icons';

import {
    hrWalletsApi,
    type WalletItem,
    type WalletTransactionListItem,
    type WalletTransactionType,
} from '../../../api/hrWallets';

const { Text } = Typography;

const PAGE_SIZE = 10;

const formatToken = (value: number | string) =>
    Number(value ?? 0).toLocaleString('vi-VN');

const getTransactionLabel = (type?: string) => {
    switch (type) {
        case 'REWARD':
            return 'Thưởng';
        case 'PENALTY':
            return 'Khấu trừ';
        case 'TRANSFER':
            return 'Chuyển';
        default:
            return type ?? '—';
    }
};

const getTransactionColor = (type?: string) => {
    switch (type) {
        case 'REWARD':
            return 'green';
        case 'PENALTY':
            return 'red';
        case 'TRANSFER':
            return 'blue';
        default:
            return 'default';
    }
};

interface WalletTransactionHistoryProps {
    wallets: WalletItem[];
    refreshKey?: number;
}
const WalletTransactionHistory: React.FC<
    WalletTransactionHistoryProps
> = ({
    wallets,
    refreshKey = 0,
}) => {
        const [transactions, setTransactions] = useState<
            WalletTransactionListItem[]
        >([]);

        const [loading, setLoading] = useState(false);

        const [currentPage, setCurrentPage] = useState(1);
        const [total, setTotal] = useState(0);

        const [typeFilter, setTypeFilter] = useState<
            WalletTransactionType | undefined
        >(undefined);
        const [employeeFilter, setEmployeeFilter] = useState<
            string | undefined
        >(undefined);

        const fetchTransactions = useCallback(async () => {
            setLoading(true);

            try {
                const response =
                    await hrWalletsApi.getAllTransactions({
                        page: currentPage,
                        limit: PAGE_SIZE,
                        type: typeFilter,
                        employeeId: employeeFilter,
                    });

                /*
                 * Theo response pattern hiện tại của project:
                 * response.data chứa business payload.
                 */
                const payload = (response as any)?.data;

                setTransactions(payload?.result ?? []);
                setTotal(payload?.meta?.total ?? 0);
            } catch (error: any) {
                message.error(
                    error?.response?.data?.message ??
                    error?.message ??
                    'Không thể tải lịch sử giao dịch F-Token',
                );
            } finally {
                setLoading(false);
            }
        }, [
            currentPage,
            typeFilter,
            employeeFilter,
        ]);

        useEffect(() => {
            fetchTransactions();
        }, [fetchTransactions, refreshKey]);

        const handleTypeChange = (
            value: WalletTransactionType | undefined,
        ) => {
            setTypeFilter(value);
            // Khi đổi filter phải quay về trang đầu.
            setCurrentPage(1);
        };
        const handleEmployeeChange = (
            value: string | undefined,
        ) => {
            setEmployeeFilter(value);
            setCurrentPage(1);
        };

        const columns: ColumnsType<WalletTransactionListItem> = [
            {
                title: 'Nhân viên',
                key: 'employee',
                width: 230,
                render: (_, transaction) => {
                    const employee =
                        transaction.wallet?.employee;

                    return (
                        <Flex vertical gap={0}>
                            <Text strong>
                                {employee?.fullName ??
                                    'Chưa có tên'}
                            </Text>

                            <Text
                                type="secondary"
                                style={{ fontSize: 12 }}
                            >
                                {employee?.email ?? '—'}
                            </Text>
                        </Flex>
                    );
                },
            },
            {
                title: 'Loại giao dịch',
                dataIndex: 'type',
                key: 'type',
                width: 140,
                align: 'center',
                render: type => (
                    <Tag color={getTransactionColor(type)}>
                        {getTransactionLabel(type)}
                    </Tag>
                ),
            },
            {
                title: 'Số F-Token',
                dataIndex: 'amount',
                key: 'amount',
                width: 150,
                align: 'right',
                render: (amount, transaction) => {
                    const prefix =
                        transaction.type === 'PENALTY'
                            ? '-'
                            : '+';

                    return (
                        <Text
                            strong
                            type={
                                transaction.type === 'PENALTY'
                                    ? 'danger'
                                    : undefined
                            }
                        >
                            {prefix}
                            {formatToken(amount)}
                        </Text>
                    );
                },
            },
            {
                title: 'Lý do',
                dataIndex: 'reason',
                key: 'reason',
                ellipsis: true,
                render: reason => (
                    <Text>
                        {reason || '—'}
                    </Text>
                ),
            },
            {
                title: 'Thời gian',
                dataIndex: 'createdAt',
                key: 'createdAt',
                width: 180,
                render: value => (
                    <Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                    >
                        {value
                            ? new Date(value).toLocaleString(
                                'vi-VN',
                            )
                            : '—'}
                    </Text>
                ),
            },
        ];

        return (
            <Card
                bordered={false}
                style={{
                    marginTop: 24,
                    borderRadius: 12,
                    boxShadow:
                        '0 2px 8px rgba(0,0,0,0.05)',
                }}
                styles={{
                    body: {
                        padding: 0,
                    },
                }}
            >
                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={12}
                    style={{
                        padding: '18px 20px',
                        borderBottom:
                            '1px solid #f0f0f0',
                    }}
                >
                    <Flex align="center" gap={8}>
                        <HistoryOutlined />

                        <Text strong style={{ fontSize: 15 }}>
                            Lịch sử giao dịch F-Token
                        </Text>
                    </Flex>
                    <Flex gap={8} wrap="wrap">

                    </Flex>
                    <Select
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        style={{ width: 240 }}
                        placeholder="Tất cả nhân viên"
                        value={employeeFilter}
                        onChange={handleEmployeeChange}
                        options={wallets
                            .filter(wallet => wallet.employee?.id)
                            .map(wallet => ({
                                value: wallet.employee!.id,
                                label: `${wallet.employee?.fullName ??
                                    'Chưa có tên'
                                    } — ${wallet.employee?.email ?? ''
                                    }`,
                            }))}
                    />

                    <Select
                        allowClear
                        style={{ width: 190 }}
                        placeholder="Tất cả giao dịch"
                        value={typeFilter}
                        onChange={handleTypeChange}
                        options={[
                            {
                                value: 'REWARD',
                                label: 'Thưởng',
                            },
                            {
                                value: 'PENALTY',
                                label: 'Khấu trừ',
                            },
                            {
                                value: 'TRANSFER',
                                label: 'Chuyển',
                            },
                        ]}
                    />
                </Flex>

                <Table<WalletTransactionListItem>
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 900 }}
                    locale={{
                        emptyText:
                            'Chưa có giao dịch F-Token',
                    }}
                />

                {total > 0 && (
                    <Flex
                        justify="flex-end"
                        style={{
                            padding: '16px 20px',
                            borderTop:
                                '1px solid #f0f0f0',
                        }}
                    >
                        <Pagination
                            current={currentPage}
                            pageSize={PAGE_SIZE}
                            total={total}
                            showSizeChanger={false}
                            showTotal={value =>
                                `Tổng ${value} giao dịch`
                            }
                            onChange={page =>
                                setCurrentPage(page)
                            }
                        />
                    </Flex>
                )}
            </Card>
        );
    };

export default WalletTransactionHistory;