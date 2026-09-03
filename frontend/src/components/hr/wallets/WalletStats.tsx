import React, { useMemo } from 'react';
import {
    Card,
    Col,
    Flex,
    Row,
    Typography,
} from 'antd';
import {
    TeamOutlined,
    WalletOutlined,
} from '@ant-design/icons';

import type { WalletItem } from '../../../api/hrWallets';

const { Text } = Typography;

interface WalletStatsProps {
    wallets: WalletItem[];
    totalWallets: number;
}

interface StatCardProps {
    label: string;
    value: string;
    description: string;
    icon: React.ReactNode;
}

const formatToken = (value: number | string) =>
    Number(value ?? 0).toLocaleString('vi-VN');

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    description,
    icon,
}) => (
    <Card
        bordered={false}
        style={{
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            height: '100%',
        }}
        styles={{
            body: {
                padding: 24,
            },
        }}
    >
        <Flex justify="space-between" align="flex-start">
            <div>
                <Text
                    type="secondary"
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                    }}
                >
                    {label}
                </Text>

                <div
                    style={{
                        marginTop: 8,
                        fontSize: 30,
                        fontWeight: 700,
                    }}
                >
                    {value}
                </div>

                <Text
                    type="secondary"
                    style={{ fontSize: 12 }}
                >
                    {description}
                </Text>
            </div>

            <div
                style={{
                    fontSize: 24,
                    padding: 10,
                    borderRadius: 10,
                    background: '#f0f5ff',
                }}
            >
                {icon}
            </div>
        </Flex>
    </Card>
);

const WalletStats: React.FC<WalletStatsProps> = ({
    wallets,
    totalWallets,
}) => {
    const tokenOnCurrentPage = useMemo(
        () =>
            wallets.reduce(
                (sum, wallet) =>
                    sum + Number(wallet.balance ?? 0),
                0,
            ),
        [wallets],
    );

    const activeWalletsOnCurrentPage = useMemo(
        () =>
            wallets.filter(
                wallet =>
                    wallet.status?.toUpperCase() === 'ACTIVE',
            ).length,
        [wallets],
    );

    return (
        <Row
            gutter={[16, 16]}
            style={{ marginBottom: 24 }}
        >
            <Col xs={24} md={8}>
                <StatCard
                    label="Tổng số ví"
                    value={totalWallets.toLocaleString('vi-VN')}
                    description="Tổng số ví từ backend"
                    icon={<WalletOutlined />}
                />
            </Col>

            <Col xs={24} md={8}>
                <StatCard
                    label="Token đang hiển thị"
                    value={formatToken(tokenOnCurrentPage)}
                    description="Tổng số dư của dữ liệu đã tải"
                    icon={<span>🪙</span>}
                />
            </Col>

            <Col xs={24} md={8}>
                <StatCard
                    label="Ví đang hoạt động"
                    value={activeWalletsOnCurrentPage.toLocaleString(
                        'vi-VN',
                    )}
                    description="Trong danh sách hiện đang tải"
                    icon={<TeamOutlined />}
                />
            </Col>
        </Row>
    );
};

export default WalletStats;