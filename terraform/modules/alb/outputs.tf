output "alb_arn" {
  description = "ARN of the ALB"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Canonical hosted zone ID of the ALB (for Route 53 Alias record)"
  value       = aws_lb.main.zone_id
}

output "backend_target_group_arn" {
  description = "ARN of the Backend Target Group"
  value       = aws_lb_target_group.backend.arn
}

output "jenkins_target_group_arn" {
  description = "ARN of the Jenkins Target Group"
  value       = aws_lb_target_group.jenkins.arn
}
