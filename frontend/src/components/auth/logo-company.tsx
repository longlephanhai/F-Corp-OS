import { Flex, theme } from "antd";
import { SafetyOutlined } from '@ant-design/icons';

const CompanyLogo = () => {
    const { token } = theme.useToken();

    return (
        <Flex justify="center">
            <div
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: token.borderRadiusLG,
                    background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 6px 16px ${token.colorPrimaryBorder}`,
                }}
            >
                <SafetyOutlined style={{ fontSize: 26, color: token.colorWhite }} />
            </div>
        </Flex>
    );
};

export default CompanyLogo;