terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ==============================================================================
# 1. NETWORK (VPC, 4 Subnets, IGW, NAT Gateway)
# ==============================================================================
module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = "10.0.0.0/16"
}

# ==============================================================================
# 2. SECURITY GROUPS (ALB, Backend, Jenkins, RDS)
# ==============================================================================
module "security_groups" {
  source = "./modules/security_groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  admin_ip     = var.admin_ip
}

# ==============================================================================
# 3. ACM SSL CERTIFICATE (Automatic DNS Validation via Route 53)
# ==============================================================================
module "acm" {
  source = "./modules/acm"

  domain_name = var.domain_name
}

# ==============================================================================
# 4. APPLICATION LOAD BALANCER (HTTPS 443 + Host-based Routing + WebSocket)
# ==============================================================================
module "alb" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  alb_sg_id         = module.security_groups.alb_sg_id
  certificate_arn   = module.acm.certificate_arn
  domain_name       = var.domain_name
}

# ==============================================================================
# 5. RDS MYSQL (Storage Auto Scaling 20GB -> 100GB in Private Subnets)
# ==============================================================================
module "rds" {
  source = "./modules/rds"

  project_name       = var.project_name
  environment        = var.environment
  private_subnet_ids = module.vpc.private_subnet_ids
  rds_sg_id          = module.security_groups.rds_sg_id
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  db_instance_class  = var.db_instance_class
}

# ==============================================================================
# 6. ROUTE 53 DNS (Public Alias Records for ALB + Private DNS for RDS)
# ==============================================================================
module "dns" {
  source = "./modules/dns"

  domain_name    = var.domain_name
  public_zone_id = module.acm.zone_id
  alb_dns_name   = module.alb.alb_dns_name
  alb_zone_id    = module.alb.alb_zone_id
  vpc_id         = module.vpc.vpc_id
  db_address     = module.rds.db_address
}

# ==============================================================================
# 7. EC2 COMPUTE (Backend NestJS + Jenkins in Private Subnet)
# ==============================================================================
module "ec2" {
  source = "./modules/ec2"

  project_name             = var.project_name
  environment              = var.environment
  private_subnet_id        = module.vpc.private_subnet_ids[0] # Subnet 1a
  backend_sg_id            = module.security_groups.backend_sg_id
  jenkins_sg_id            = module.security_groups.jenkins_sg_id
  backend_instance_type    = var.backend_instance_type
  jenkins_instance_type    = var.jenkins_instance_type
  backend_target_group_arn = module.alb.backend_target_group_arn
  jenkins_target_group_arn = module.alb.jenkins_target_group_arn

  depends_on = [module.vpc]
}
