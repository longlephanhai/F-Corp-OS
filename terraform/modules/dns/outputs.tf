output "api_fqdn" {
  description = "Fully Qualified Domain Name for Backend API"
  value       = aws_route53_record.api.fqdn
}

output "jenkins_fqdn" {
  description = "Fully Qualified Domain Name for Jenkins"
  value       = aws_route53_record.jenkins.fqdn
}

output "db_internal_fqdn" {
  description = "Private Domain Name for Database"
  value       = aws_route53_record.rds.fqdn
}
