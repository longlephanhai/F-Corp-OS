import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Select,
} from 'antd';

import {
    hrWalletsApi,
    type CreateWalletTransactionPayload,
    type WalletTransactionType,
} from '../../../api/hrWallets';

import { callFetchUsers } from '../../../api';

interface WalletTransactionModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
}

interface EmployeeOption {
    id: string;
    fullName?: string;
    email?: string;
    title?: string;
    isDeleted?: boolean;
}

interface TransactionFormValues {
    employeeId: string;
    type: WalletTransactionType;
    amount: number;
    reason: string;
}

const WalletTransactionModal: React.FC<
    WalletTransactionModalProps
> = ({
    open,
    onClose,
    onSuccess,
}) => {
    const [form] = Form.useForm<TransactionFormValues>();

    const [employees, setEmployees] = useState<EmployeeOption[]>(
        [],
    );

    const [employeesLoading, setEmployeesLoading] =
        useState(false);

    const [submitting, setSubmitting] = useState(false);

    const loadEmployees = useCallback(async () => {
        setEmployeesLoading(true);

        try {
            const response = await callFetchUsers(
                'current=1&pageSize=1000',
            );

            /*
             * Axios interceptor của project trả response.data.
             * Backend response tiếp tục bọc business payload trong data.
             */
            const payload = (response as any)?.data;

            const result: EmployeeOption[] =
                payload?.result ?? [];

            setEmployees(
                result.filter(
                    employee =>
                        employee.isDeleted !== true,
                ),
            );
        } catch (error: any) {
            message.error(
                error?.message ??
                    'Không thể tải danh sách nhân viên',
            );
        } finally {
            setEmployeesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        loadEmployees();
    }, [open, loadEmployees]);

    const handleCancel = () => {
        if (submitting) {
            return;
        }

        form.resetFields();
        onClose();
    };

    const handleSubmit = async (
        values: TransactionFormValues,
    ) => {
        setSubmitting(true);

        try {
            const payload: CreateWalletTransactionPayload = {
                employeeId: values.employeeId,
                type: values.type,
                amount: Number(values.amount),
                reason: values.reason.trim(),
            };

            await hrWalletsApi.createTransaction(payload);

            message.success(
                values.type === 'REWARD'
                    ? 'Cấp F-Token thành công'
                    : 'Trừ F-Token thành công',
            );

            form.resetFields();

            await onSuccess();

            onClose();
        } catch (error: any) {
            message.error(
                error?.message ??
                    'Không thể thực hiện giao dịch F-Token',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Giao dịch F-Token"
            open={open}
            onCancel={handleCancel}
            onOk={() => form.submit()}
            confirmLoading={submitting}
            okText="Xác nhận"
            cancelText="Hủy"
            destroyOnHidden
        >
            <Form<TransactionFormValues>
                form={form}
                layout="vertical"
                initialValues={{
                    type: 'REWARD',
                }}
                onFinish={handleSubmit}
                style={{ marginTop: 20 }}
            >
                <Form.Item
                    label="Nhân viên"
                    name="employeeId"
                    rules={[
                        {
                            required: true,
                            message:
                                'Vui lòng chọn nhân viên',
                        },
                    ]}
                >
                    <Select
                        showSearch
                        loading={employeesLoading}
                        placeholder="Chọn nhân viên"
                        optionFilterProp="label"
                        options={employees.map(employee => ({
                            value: employee.id,
                            label: `${
                                employee.fullName ??
                                'Chưa có tên'
                            } — ${
                                employee.email ?? ''
                            }`,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    label="Loại giao dịch"
                    name="type"
                    rules={[
                        {
                            required: true,
                            message:
                                'Vui lòng chọn loại giao dịch',
                        },
                    ]}
                >
                    <Select
                        options={[
                            {
                                value: 'REWARD',
                                label: 'Cấp / Thưởng F-Token',
                            },
                            {
                                value: 'PENALTY',
                                label: 'Trừ F-Token',
                            },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    label="Số lượng F-Token"
                    name="amount"
                    rules={[
                        {
                            required: true,
                            message:
                                'Vui lòng nhập số F-Token',
                        },
                        {
                            type: 'number',
                            min: 0.01,
                            message:
                                'Số lượng phải lớn hơn 0',
                        },
                    ]}
                >
                    <InputNumber
                        min={0.01}
                        precision={2}
                        style={{ width: '100%' }}
                        placeholder="Ví dụ: 500"
                    />
                </Form.Item>

                <Form.Item
                    label="Lý do"
                    name="reason"
                    rules={[
                        {
                            required: true,
                            whitespace: true,
                            message:
                                'Vui lòng nhập lý do',
                        },
                        {
                            max: 1000,
                            message:
                                'Lý do tối đa 1000 ký tự',
                        },
                    ]}
                >
                    <Input.TextArea
                        rows={4}
                        maxLength={1000}
                        showCount
                        placeholder="Nhập lý do thực hiện giao dịch..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default WalletTransactionModal;