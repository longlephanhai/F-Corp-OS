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

variable "private_subnet_id" {
  description = "Private Subnet ID where EC2 instances are launched"
  type        = string
}

variable "backend_sg_id" {
  description = "Security Group ID for Backend EC2"
  type        = string
}

variable "jenkins_sg_id" {
  description = "Security Group ID for Jenkins EC2"
  type        = string
}

variable "backend_instance_type" {
  description = "EC2 instance type for Backend"
  type        = string
  default     = "t3.small"
}

variable "jenkins_instance_type" {
  description = "EC2 instance type for Jenkins"
  type        = string
  default     = "t3.small"
}

variable "backend_target_group_arn" {
  description = "ARN of the Backend Target Group"
  type        = string
}

variable "jenkins_target_group_arn" {
  description = "ARN of the Jenkins Target Group"
  type        = string
}
