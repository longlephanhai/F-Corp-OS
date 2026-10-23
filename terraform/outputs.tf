output "alb_dns_name" {
  description = "Application Load Balancer DNS Name"
  value       = module.alb.alb_dns_name
}

output "api_endpoint" {
  description = "Backend API Endpoint (HTTPS)"
  value       = "https://${module.dns.api_fqdn}"
}

output "jenkins_url" {
  description = "Jenkins CI/CD Dashboard URL (HTTPS)"
  value       = "https://${module.dns.jenkins_fqdn}"
}

output "rds_internal_endpoint" {
  description = "Database Hostname for Backend .env"
  value       = module.dns.db_internal_fqdn
}

output "backend_private_ip" {
  description = "Private IP of the Backend EC2"
  value       = module.ec2.backend_private_ip
}

output "jenkins_private_ip" {
  description = "Private IP of the Jenkins EC2"
  value       = module.ec2.jenkins_private_ip
}

output "nat_gateway_public_ip" {
  description = "Public IP of the NAT Gateway"
  value       = module.vpc.nat_gateway_ip
}

output "ssh_private_key_path" {
  description = "Path to the generated SSH Private Key file"
  value       = "terraform/keypair/fcorp-key.pem"
}
