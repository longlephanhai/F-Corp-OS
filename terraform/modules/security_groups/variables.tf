variable "vpc_id" {
  description = "VPC ID where Security Groups will be created"
  type        = string
}

variable "project_name" {
  description = "Prefix name for all resources"
  type        = string
  default     = "fcorp"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "admin_ip" {
  description = "Admin IP allowed to SSH into servers (CIDR format e.g. 1.2.3.4/32)"
  type        = string
  default     = "0.0.0.0/0"
}
