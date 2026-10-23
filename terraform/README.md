# Hướng Dẫn Triển Khai Hạ Tầng AWS Bằng Terraform

Thư mục này chứa toàn bộ mã nguồn Terraform (IaC) để khởi tạo hạ tầng cho dự án **F-Corp-OS** tại Region **Singapore (`ap-southeast-1`)**.

---

## 🏛️ Cấu Trúc Các Module

* **`modules/vpc`**: Khởi tạo VPC `10.0.0.0/16`, 2 Public Subnets, 2 Private Subnets, Internet Gateway và NAT Gateway.
* **`modules/security_groups`**: Cấu hình tường lửa phân tầng cho ALB, Backend EC2, Jenkins EC2 và RDS MySQL.
* **`modules/acm`**: Xin cấp chứng chỉ SSL miễn phí và tự động xác thực DNS qua Route 53.
* **`modules/alb`**: Cân bằng tải Application Load Balancer cổng HTTPS 443, hỗ trợ WebSockets (Idle timeout 300s, Stickiness) và Host-based Routing cho `api.` và `jenkins.`.
* **`modules/rds`**: Database MySQL 8.0 trong Private Subnet với tính năng Storage Auto Scaling (20GB - 100GB).
* **`modules/dns`**: Tạo bản ghi Public Alias cho ALB và Private DNS (`db.yourdomain.com`) cho RDS.
* **`modules/ec2`**: Khởi tạo EC2 Backend và EC2 Jenkins trong Private Subnet, tự động cài đặt Docker, Docker Compose, Jenkins và cấu hình 2GB Swap Memory.

---

## 🚀 Các Bước Thực Hiện Triển Khai

### 1. Chuẩn Bị File Biến `terraform.tfvars`
Copy file mẫu:
```bash
cp terraform.tfvars.example terraform.tfvars
```
Mở file `terraform.tfvars` và điền thông tin thực tế của bạn:
* `domain_name`: Tên miền bạn đã mua trên Route 53 (ví dụ: `yourdomain.com`).
* `ssh_public_key`: Nội dung SSH Public Key của bạn (thường ở `~/.ssh/id_rsa.pub` hoặc chạy `ssh-keygen` nếu chưa có).
* `db_password`: Mật khẩu cho Database MySQL (ít nhất 8 ký tự).

### 2. Cấu Hình AWS CLI (Nếu chưa đăng nhập)
```bash
aws configure
```
Nhập **AWS Access Key ID**, **AWS Secret Access Key**, và Default region: `ap-southeast-1`.

### 3. Xem Trước Kế Hoạch (Plan)
```bash
terraform plan
```
Terraform sẽ liệt kê danh sách tài nguyên chuẩn bị được tạo trên AWS.

### 4. Áp Dụng Triển Khai (Apply)
```bash
terraform apply -auto-approve
```
*(Quá trình khởi tạo thường mất từ 5 - 10 phút, chủ yếu chờ RDS MySQL và ACM Certificate xác thực).*

### 5. Lấy Thông Tin Sau Khi Triển Khai (Outputs)
Sau khi hoàn tất, Terraform sẽ in ra các thông tin:
* `api_endpoint`: Đường dẫn API Backend (`https://api.yourdomain.com`).
* `jenkins_url`: Đường dẫn giao diện Jenkins (`https://jenkins.yourdomain.com`).
* `rds_internal_endpoint`: Tên miền nội bộ của Database (`db.yourdomain.com`).
* `backend_private_ip`: IP nội bộ của Backend EC2.
* `jenkins_private_ip`: IP nội bộ của Jenkins EC2.

---

## 🗑️ Cách Hủy Hạ Tầng Khi Không Còn Sử Dụng (Dọn dẹp chi phí)
Khi bạn test xong trong ngày và muốn tắt toàn bộ tài nguyên để tránh phát sinh chi phí:
```bash
terraform destroy -auto-approve
```
