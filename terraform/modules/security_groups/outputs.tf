output "alb_sg_id" {
  description = "ID of ALB Security Group"
  value       = aws_security_group.alb.id
}

output "backend_sg_id" {
  description = "ID of Backend Security Group"
  value       = aws_security_group.backend.id
}

output "jenkins_sg_id" {
  description = "ID of Jenkins Security Group"
  value       = aws_security_group.jenkins.id
}

output "rds_sg_id" {
  description = "ID of RDS Security Group"
  value       = aws_security_group.rds.id
}
