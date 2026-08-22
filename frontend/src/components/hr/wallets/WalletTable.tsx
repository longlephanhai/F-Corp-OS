import React from 'react';
import {
    Avatar,
    Flex,
    Tag,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { WalletOutlined } from '@ant-design/icons';

import ActionTable from '../../ui/ActionTable';
import type { WalletItem } from '../../../api/hrWallets';

const { Text } = Typography;

interface WalletTableProps {
    wallets: WalletItem[];
    loading: boolean;
}

const getInitials = (fullName?: string) => {
    if (!fullName) return '?';

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
};

const formatToken = (value: number | string) =>
    Number(value ?? 0).toLocaleString('vi-VN');

const WalletTable: React.FC<WalletTableProps> = ({
    wallets,
    loading,
}) => {
    const columns: ColumnsType<WalletItem> = [
        {
            title: 'Nhân viên',
            key: 'employee',
            width: 260,
            render: (_, wallet) => {
                const employee = wallet.employee;

                return (
                    <Flex align="center" gap={10}>
                        <Avatar>
                            {getInitials(employee?.fullName)}
                        </Avatar>

                        <Flex vertical gap={0}>
                            <Text strong style={{ fontSize: 13 }}>
                                {employee?.fullName ?? 'Chưa có tên'}
                            </Text>

                            <Text
                                type="secondary"
                                style={{ fontSize: 11 }}
                            >
                                {employee?.email ?? '—'}
                            </Text>
                        </Flex>
                    </Flex>
                );
            },
        },
        {
            title: 'Chức danh',
            key: 'title',
            width: 180,
            render: (_, wallet) => (
                <Text style={{ fontSize: 13 }}>
                    {wallet.employee?.title || '—'}
                </Text>
            ),
        },
        {
            title: 'Số dư',
            dataIndex: 'balance',
            key: 'balance',
            width: 160,
            align: 'right',
            sorter: (a, b) =>
                Number(a.balance) - Number(b.balance),
            render: value => (
                <Text strong style={{ fontSize: 14 }}>
                    {formatToken(value)} F-Token
                </Text>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            align: 'center',
            render: status => {
                const isActive =
                    status?.toUpperCase() === 'ACTIVE';

                return (
                    <Tag
                        color={isActive ? 'green' : 'default'}
                        style={{
                            borderRadius: 999,
                            fontWeight: 600,
                        }}
                    >
                        {isActive
                            ? 'Đang hoạt động'
                            : status ?? '—'}
                    </Tag>
                );
            },
        },
        {
            title: 'Cập nhật',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 170,
            render: value => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {value
                        ? new Date(value).toLocaleString('vi-VN')
                        : '—'}
                </Text>
            ),
        },
    ];

    return (
        <ActionTable<WalletItem>
            columns={columns}
            dataSource={wallets}
            rowKey="id"
            scrollX={900}
            searchPlaceholder="Tìm theo tên hoặc email nhân viên..."
            onSearch={(wallet, query) => {
                const term = query.toLowerCase();

                return (
                    wallet.employee?.fullName
                        ?.toLowerCase()
                        .includes(term) ||
                    wallet.employee?.email
                        ?.toLowerCase()
                        .includes(term) ||
                    false
                );
            }}
            resultLabel="Ví"
            tableTitle={
                <Flex align="center" gap={8}>
                    <WalletOutlined />

                    <Text strong style={{ fontSize: 15 }}>
                        Danh sách ví nhân viên
                    </Text>

                    {loading && (
                        <Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                        >
                            Đang tải...
                        </Text>
                    )}
                </Flex>
            }
        />
    );
};

export default WalletTable;