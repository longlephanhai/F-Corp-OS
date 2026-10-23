output "certificate_arn" {
  description = "Validated ACM certificate ARN"
  value       = aws_acm_certificate_validation.cert.certificate_arn
}

output "zone_id" {
  description = "Zone ID of the primary hosted zone"
  value       = data.aws_route53_zone.primary.zone_id
}
