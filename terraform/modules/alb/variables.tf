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

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs where ALB is deployed"
  type        = list(string)
}

variable "alb_sg_id" {
  description = "Security Group ID for ALB"
  type        = string
}

variable "certificate_arn" {
  description = "ACM Certificate ARN for HTTPS listener"
  type        = string
}

variable "domain_name" {
  description = "Root domain name (e.g. yourdomain.com)"
  type        = string
}
