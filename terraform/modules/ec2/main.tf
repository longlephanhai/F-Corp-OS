# 1. Lookup Latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# 2. IAM Role & Instance Profile for AWS Systems Manager (SSM)
resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# 3. Tự động sinh khóa bí mật RSA
resource "tls_private_key" "main" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

# 4. Đăng ký Public Key lên AWS EC2 Key Pair
resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-${var.environment}-key"
  public_key = tls_private_key.main.public_key_openssh
}

# 5. Tự động xuất file Private Key (.pem) vào thư mục keypair/ (chmod 400)
resource "local_file" "private_key" {
  content         = tls_private_key.main.private_key_pem
  filename        = "${path.root}/keypair/fcorp-key.pem"
  file_permission = "0400"
}

# 6. Tự động xuất file Public Key (.pub) vào thư mục keypair/ (chmod 644)
resource "local_file" "public_key" {
  content         = tls_private_key.main.public_key_openssh
  filename        = "${path.root}/keypair/fcorp-key.pub"
  file_permission = "0644"
}

# 7. User Data Script for Backend (Docker, Docker Compose, 2GB Swap)
locals {
  backend_user_data = <<-EOF
              #!/bin/bash
              set -e

              # 1. Create 2GB Swap Memory to prevent OOM
              fallocate -l 2G /swapfile
              chmod 600 /swapfile
              mkswap /swapfile
              swapon /swapfile
              echo '/swapfile none swap sw 0 0' >> /etc/fstab

              # 2. Install Docker & Docker Compose
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg lsb-release
              mkdir -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

              # 3. Configure Docker
              systemctl enable docker
              systemctl start docker
              usermod -aG docker ubuntu

              # 4. Create App directory
              mkdir -p /app
              chown -R ubuntu:ubuntu /app
              EOF

  # Chạy Jenkins qua Docker container (cực nhanh, ổn định 100%)
  jenkins_user_data = <<-EOF
              #!/bin/bash
              set -e

              # 1. Create 2GB Swap Memory
              fallocate -l 2G /swapfile
              chmod 600 /swapfile
              mkswap /swapfile
              swapon /swapfile
              echo '/swapfile none swap sw 0 0' >> /etc/fstab

              # 2. Install Docker & Docker Compose
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg lsb-release
              mkdir -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

              systemctl enable docker
              systemctl start docker
              usermod -aG docker ubuntu

              # 3. Khởi chạy Jenkins LTS Container
              mkdir -p /var/jenkins_home
              chown -R 1000:1000 /var/jenkins_home

              docker run -d \
                --name jenkins \
                --restart always \
                -p 8080:8080 \
                -p 50000:50000 \
                -v /var/jenkins_home:/var/jenkins_home \
                -v /var/run/docker.sock:/var/run/docker.sock \
                -v /usr/bin/docker:/usr/bin/docker \
                jenkins/jenkins:lts-jdk17
              EOF
}

# 8. EC2 Backend Instance (Private Subnet)
resource "aws_instance" "backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.backend_instance_type
  subnet_id              = var.private_subnet_id
  vpc_security_group_ids = [var.backend_sg_id]
  key_name               = aws_key_pair.deployer.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = local.backend_user_data

  tags = {
    Name        = "${var.project_name}-${var.environment}-backend"
    Environment = var.environment
    Role        = "Backend"
  }
}

# 9. EC2 Jenkins Instance (Private Subnet, routed through ALB)
resource "aws_instance" "jenkins" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.jenkins_instance_type
  subnet_id              = var.private_subnet_id
  vpc_security_group_ids = [var.jenkins_sg_id]
  key_name               = aws_key_pair.deployer.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = local.jenkins_user_data

  tags = {
    Name        = "${var.project_name}-${var.environment}-jenkins"
    Environment = var.environment
    Role        = "CI/CD"
  }
}

# 10. Attach Backend EC2 to Backend Target Group
resource "aws_lb_target_group_attachment" "backend" {
  target_group_arn = var.backend_target_group_arn
  target_id        = aws_instance.backend.id
  port             = 8080
}

# 11. Attach Jenkins EC2 to Jenkins Target Group
resource "aws_lb_target_group_attachment" "jenkins" {
  target_group_arn = var.jenkins_target_group_arn
  target_id        = aws_instance.jenkins.id
  port             = 8080
}
