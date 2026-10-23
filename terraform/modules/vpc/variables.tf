variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
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

variable "public_subnet_cidrs" {
  description = "CIDR blocks for 2 public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for 2 private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "availability_zones" {
  description = "List of 2 availability zones in Singapore"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}
