import { Button, Card, Form, Input, message, notification, Typography } from 'antd'
import { useEffect, useState } from 'react';
import { callApiLogin } from '../../api';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { setUserLoginInfo } from '../../redux/account/accountSlice';

const LoginPage = () => {

    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);

    console.log('isAuthenticated', isAuthenticated)
    

    useEffect(() => {
        if (isAuthenticated) {
            window.location.href = '/admin';
        }
    }, [isAuthenticated])

    const [form] = Form.useForm();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleFinish = async (values: { email: string; password: string }) => {
        try {
            const { email, password } = values;
            setIsLoading(true);
            const response = await callApiLogin({ email, password });
            console.log('response', response);
            setIsLoading(false);
            if (response && response.data) {
                localStorage.setItem('access_token', response.data.access_token);
                dispatch(setUserLoginInfo(response.data.user));
                message.success('Đăng nhập thành công');
                window.location.href = '/admin';
            }
        } catch (error) {
            setIsLoading(false);
            notification.error({
                message: 'Đăng nhập thất bại',
                description: (error as any)?.message || 'Có lỗi xảy ra, vui lòng thử lại sau',
            });
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                background: '#f5f5f5',
            }}
        >
            <Card style={{ width: '100%', maxWidth: 420 }}>
                <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 24, textAlign: 'center' }}>
                    Login
                </Typography.Title>

                <Form
                    layout="vertical"
                    onFinish={handleFinish}
                    form={form}
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input placeholder="Nhập email" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập password' }]}
                    >
                        <Input.Password placeholder="Nhập password" />
                    </Form.Item>

                    <Button loading={isLoading} type="primary" htmlType="submit" block>
                        Đăng nhập
                    </Button>
                </Form>
            </Card>
        </div>
    )
}

export default LoginPage