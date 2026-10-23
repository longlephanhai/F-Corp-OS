# 1. Route 53 Public Alias Record: api.yourdomain.com -> ALB
resource "aws_route53_record" "api" {
  zone_id = var.public_zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# 2. Route 53 Public Alias Record: jenkins.yourdomain.com -> ALB
resource "aws_route53_record" "jenkins" {
  zone_id = var.public_zone_id
  name    = "jenkins.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# 3. Route 53 Private Hosted Zone for VPC (Internal DNS)
resource "aws_route53_zone" "private" {
  name = var.domain_name

  vpc {
    vpc_id = var.vpc_id
  }

  tags = {
    Name = "fcorp-internal-zone"
  }
}

# 4. Route 53 Private CNAME Record: db.yourdomain.com -> RDS Address
resource "aws_route53_record" "rds" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "db.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.db_address]
}
