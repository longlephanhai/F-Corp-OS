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

variable "private_subnet_ids" {
  description = "List of private subnet IDs for DB Subnet Group"
  type        = list(string)
}

variable "rds_sg_id" {
  description = "Security Group ID for RDS MySQL"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "fcorp_db"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class (e.g. db.t4g.micro or db.t3.micro)"
  type        = string
  default     = "db.t4g.micro"
}
