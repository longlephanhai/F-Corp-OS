variable "aws_region" {
  description = "AWS Region to deploy resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "fcorp"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Root domain name registered on AWS Route 53 (e.g. yourdomain.com)"
  type        = string
}

variable "admin_ip" {
  description = "Your personal IP address for SSH access (e.g. 113.161.x.x/32 or 0.0.0.0/0)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "db_name" {
  description = "MySQL database name"
  type        = string
  default     = "fcorp_db"
}

variable "db_username" {
  description = "MySQL master username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "MySQL master password (minimum 8 characters)"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "backend_instance_type" {
  description = "EC2 instance type for Backend NestJS"
  type        = string
  default     = "t3.small"
}

variable "jenkins_instance_type" {
  description = "EC2 instance type for Jenkins CI/CD"
  type        = string
  default     = "t3.small"
}
