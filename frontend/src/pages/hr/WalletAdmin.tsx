import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Button,
    Flex,
    message,
    Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import WalletTable from '../../components/hr/wallets/WalletTable';
import WalletStats from '../../components/hr/wallets/WalletStats';
import {
    hrWalletsApi,
    type WalletItem,
} from '../../api/hrWallets';

const { Title, Text } = Typography;

const WalletAdmin: React.FC = () => {
    const [wallets, setWallets] = useState<WalletItem[]>([]);
    const [loading, setLoading] = useState(false);

    const [totalWallets, setTotalWallets] = useState(0);

    const fetchWallets = useCallback(async () => {
        setLoading(true);

        try {
            const res = await hrWalletsApi.getAllWallets({
                page: 1,
                limit: 100,
            });

            /*
             * Project hiện tại đang dùng interceptor trả về backend response,
             * nên pattern này giữ giống ReviewConsole.tsx.
             */
            const payload = (res as any)?.data;

            setWallets(payload?.result ?? []);
            setTotalWallets(payload?.meta?.total ?? 0);
        } catch (err: any) {
            message.error(
                err?.message ??
                'Không thể tải danh sách ví F-Token',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWallets();
    }, [fetchWallets]);

    return (
        <div
            style={{
                fontFamily: 'Inter, sans-serif',
                color: '#1c1b1b',
            }}
        >
            {/* Header */}
            <Flex
                justify="space-between"
                align="flex-start"
                wrap="wrap"
                gap={16}
                style={{ marginBottom: 24 }}
            >
                <div>
                    <Title
                        level={3}
                        style={{
                            margin: 0,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Quản lý Ví F-Token
                    </Title>

                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Quản lý số dư F-Token của nhân viên
                        từ dữ liệu thực của hệ thống.
                    </Text>
                </div>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    style={{
                        borderRadius: 8,
                        fontWeight: 600,
                    }}
                >
                    Cấp phát F-Token
                </Button>
            </Flex>

            {/* Statistics */}
            <WalletStats
                wallets={wallets}
                totalWallets={totalWallets}
            />
            {/* Wallet table */}
            <WalletTable
                wallets={wallets}
                loading={loading}
            />
        </div>
    );
};

export default WalletAdmin;