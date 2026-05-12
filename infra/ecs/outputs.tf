output "alb_dns_name" {
  description = "Open this hostname in a browser to reach the service (HTTP on port 80)."
  value       = aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name."
  value       = aws_ecs_service.main.name
}
