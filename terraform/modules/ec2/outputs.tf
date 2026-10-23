output "backend_instance_id" {
  description = "ID of the Backend EC2 instance"
  value       = aws_instance.backend.id
}

output "backend_private_ip" {
  description = "Private IP of the Backend EC2 instance"
  value       = aws_instance.backend.private_ip
}

output "jenkins_instance_id" {
  description = "ID of the Jenkins EC2 instance"
  value       = aws_instance.jenkins.id
}

output "jenkins_private_ip" {
  description = "Private IP of the Jenkins EC2 instance"
  value       = aws_instance.jenkins.private_ip
}
