import { useState } from "react";
import { Modal, Upload, Button, Alert, Table, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { callImportUsers } from "../../api";

interface IImportResult {
  total: number;
  successCount: number;
  failCount: number;
  errors: { row: number; message: string }[];
}

interface IProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const ImportUserModal = ({ open, onCancel, onSuccess }: IProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<IImportResult | null>(null);

  const uploadProps: UploadProps = {
    maxCount: 1,
    accept: ".xlsx,.xls",
    beforeUpload: (f) => {
      setFile(f);
      return false; // chặn tự upload, để tự submit
    },
    onRemove: () => setFile(null),
  };

  const handleImport = async () => {
    if (!file) {
      message.warning("Vui lòng chọn file Excel");
      return;
    }
    setSubmitting(true);
    try {
      const res: any = await callImportUsers(file);
      setResult(res?.data);
      if (res?.data?.successCount > 0) {
        onSuccess();
      }
    } catch (err: any) {
      message.error(err?.message || "Import thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onCancel();
  };

  return (
    <Modal
      title="Import Users từ Excel"
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          Đóng
        </Button>,
        <Button
          key="import"
          type="primary"
          loading={submitting}
          onClick={handleImport}
        >
          Import
        </Button>,
      ]}
      width={640}
    >
      <Upload.Dragger {...uploadProps} fileList={file ? [file as any] : []}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p>Kéo thả hoặc bấm để chọn file .xlsx</p>
        <p style={{ color: "#999", fontSize: 12 }}>
          Cột bắt buộc: fullName, email, role, title, status (tuỳ chọn)
        </p>
      </Upload.Dragger>

      {result && (
        <div style={{ marginTop: 16 }}>
          <Alert
            type={result.failCount > 0 ? "warning" : "success"}
            message={`Thành công: ${result.successCount}/${result.total} — Lỗi: ${result.failCount}`}
            showIcon
            style={{ marginBottom: 12 }}
          />
          {result.errors.length > 0 && (
            <Table
              size="small"
              rowKey="row"
              pagination={false}
              dataSource={result.errors}
              columns={[
                { title: "Dòng", dataIndex: "row", width: 80 },
                { title: "Lỗi", dataIndex: "message" },
              ]}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default ImportUserModal;
