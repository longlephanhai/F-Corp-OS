variable "domain_name" {
  description = "Root domain name"
  type        = string
}

variable "public_zone_id" {
  description = "Zone ID of the Route 53 public hosted zone"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the ALB"
  type        = string
}

variable "alb_zone_id" {
  description = "Canonical hosted zone ID of the ALB"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for creating Private Hosted Zone"
  type        = string
}

variable "db_address" {
  description = "RDS hostname address"
  type        = string
}
