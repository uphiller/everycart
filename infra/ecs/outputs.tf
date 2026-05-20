output "alb_dns_name" {
  description = "ALB DNS name. In Cloudflare, create CNAME records from your hostnames to this target."
  value       = aws_lb.main.dns_name
}

output "alb_certificate_arn" {
  description = "ACM certificate ARN attached to the HTTPS listener."
  value       = var.enable_https ? local.alb_certificate_arn : null
}

output "acm_certificate_validation_records" {
  description = "ACM DNS validation CNAMEs. In Cloudflare: DNS only (grey cloud), then terraform apply again after the cert is ISSUED."
  value = local.create_acm_certificate ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  } : {}
}

output "cloudflare_dns_setup" {
  description = "Suggested Cloudflare records: validation CNAMEs (proxy off), origin CNAMEs to the ALB (proxy on), SSL mode full (strict)."
  value = {
    ssl_tls_mode = "full_strict"
    acm_validation = local.create_acm_certificate ? {
      for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
        type         = dvo.resource_record_type
        name         = dvo.resource_record_name
        content      = dvo.resource_record_value
        proxy_status = "dns_only"
      }
    } : {}
    origin = {
      for host in local.alb_hostnames : host => {
        type         = "CNAME"
        name         = host
        content      = aws_lb.main.dns_name
        proxy_status = "proxied"
      }
    }
  }
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name."
  value       = aws_ecs_service.main.name
}
