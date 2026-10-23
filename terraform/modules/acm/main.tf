# 1. Lookup existing Route 53 Public Hosted Zone
data "aws_route53_zone" "primary" {
  name         = var.domain_name
  private_zone = false
}

# 2. Request Free ACM SSL Certificate for Subdomains
resource "aws_acm_certificate" "cert" {
  domain_name = "api.${var.domain_name}"
  subject_alternative_names = [
    "jenkins.${var.domain_name}",
    "*.${var.domain_name}"
  ]
  validation_method = "DNS"

  tags = {
    Name = "fcorp-ssl-certificate"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# 3. Create DNS Validation Records in Route 53
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.primary.zone_id
}

# 4. Wait for Certificate Validation to Complete
resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
