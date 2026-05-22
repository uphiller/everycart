variable "aws_region" {
  type        = string
  description = "AWS region for all resources."
  default     = "ap-northeast-2"
}

variable "project_name" {
  type        = string
  description = "Short name prefix for resources."
  default     = "everycart"
}

variable "container_image" {
  type        = string
  description = "Container image (ECR URI or Docker Hub / public ECR)."
  default     = "uphiller/everycart:front"
}

variable "container_port" {
  type        = number
  description = "Port the container listens on (must match container EXPOSE / app bind)."
  default     = 80
}

variable "task_cpu" {
  type        = number
  description = "Fargate task CPU units (256, 512, 1024, ...)."
  default     = 256
}

variable "task_memory" {
  type        = number
  description = "Fargate task memory in MB (see AWS Fargate table for valid pairs)."
  default     = 512
}

variable "desired_count" {
  type        = number
  description = "Number of tasks to run in the ECS service."
  default     = 1
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR for the VPC."
  default     = "10.0.0.0/16"
}

variable "alb_host_header" {
  type        = string
  description = "Host header for ALB listener rule; only this Host is forwarded to ECS."
  default     = "everycart.bettercodelab.com"
}

variable "enable_https" {
  type        = bool
  description = "Enable HTTPS (443) on the ALB with an ACM certificate. HTTP redirects to HTTPS when true."
  default     = true
}

variable "acm_certificate_arn" {
  type        = string
  description = "Existing issued ACM certificate ARN in the ALB region. If empty and enable_https is true, Terraform requests a new certificate for alb/keycloak host headers."
  default     = ""
}

variable "acm_primary_domain" {
  type        = string
  description = "Primary domain on the ACM certificate. Defaults to alb_host_header when empty."
  default     = ""
}

variable "route53_zone_id" {
  type        = string
  description = "Route 53 hosted zone ID for ACM DNS validation (optional). Leave empty when DNS is on Cloudflare or another provider; use output cloudflare_dns_setup instead."
  default     = ""
}

variable "create_route53_alias_records" {
  type        = bool
  description = "Create Route 53 A alias records for alb_host_header and keycloak_host_header (only if route53_zone_id is set). Not used with Cloudflare DNS."
  default     = false
}

variable "alb_ssl_policy" {
  type        = string
  description = "SSL policy for the ALB HTTPS listener."
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "keycloak_container_image" {
  type        = string
  description = "Keycloak container image."
  default     = "quay.io/keycloak/keycloak:26.6.1"
}

variable "keycloak_host_header" {
  type        = string
  description = "Hostname for Keycloak (no scheme): ALB listener rule host condition; KC_HOSTNAME and KC_HOSTNAME_ADMIN are set to https://<this>."
  default     = "auth.bettercodelab.com"
}

variable "keycloak_http_enabled" {
  type        = bool
  description = "Expose Keycloak HTTP listener (KC_HTTP_ENABLED). Must be true when the ALB targets Keycloak over HTTP."
  default     = true
}

variable "keycloak_container_port" {
  type        = number
  description = "Port Keycloak listens on inside the container."
  default     = 8080
}

variable "keycloak_task_cpu" {
  type        = number
  description = "Fargate CPU units for Keycloak task."
  default     = 1024
}

variable "keycloak_task_memory" {
  type        = number
  description = "Fargate memory (MB) for Keycloak task."
  default     = 2048
}

variable "keycloak_desired_count" {
  type        = number
  description = "Desired task count for Keycloak ECS service."
  default     = 1
}

variable "keycloak_admin_username" {
  type        = string
  description = "Keycloak initial admin username (start-dev)."
  default     = "admin"
}

variable "keycloak_admin_password" {
  type        = string
  description = "Keycloak admin bootstrap password used when keycloak_admin_password_secret_arn is empty. Prefer server-local tfvars or ECS secrets ARN."
  sensitive   = true
  default     = "ChangeMeBeforeApply"
}

variable "keycloak_admin_password_secret_arn" {
  type        = string
  description = "If non-empty, KEYCLOAK_ADMIN_PASSWORD is injected from this SSM parameter or Secrets Manager secret ARN (ECS execution role receives GetSecretValue / GetParameters)."
  default     = ""
}

variable "keycloak_container_command" {
  type        = list(string)
  description = "Keycloak JVM mode args after image entrypoint: start-dev for embedded H2; start (or start --optimized on a pre-built image) with external Postgres (KC_DB_*)."
  default     = ["start"]
}

variable "keycloak_db_kind" {
  type        = string
  description = "KC_DB vendor when using external JDBC."
  default     = "postgres"
}

variable "keycloak_db_url" {
  type        = string
  description = "JDBC URL for external Postgres (e.g. Supabase); leave empty only with start-dev embedded store."
  default     = "jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
}

variable "keycloak_db_username" {
  type        = string
  description = "Database username when external DB is configured."
  default     = "postgres.jsadkloxgwvzucualbje"
}

variable "keycloak_db_schema" {
  type        = string
  description = "PostgreSQL schema for Keycloak tables (KC_DB_SCHEMA). Applied only when keycloak_db_url is set."
  default     = "keycloak"
}

variable "keycloak_db_password" {
  type        = string
  description = "Database password used when KC_DB_PASSWORD is set from Terraform (omit when keycloak_db_password_secret_arn is set)."
  sensitive   = true
  default     = ""
}

variable "keycloak_db_password_secret_arn" {
  type        = string
  description = "If external DB enabled, inject KC_DB_PASSWORD from this SSM or Secrets Manager ARN instead of keycloak_db_password."
  default     = ""
}

# -----------------------------------------------------------------------------
# Spring Boot backend (backend_java)
# -----------------------------------------------------------------------------

variable "backend_container_image" {
  type        = string
  description = "Backend Java container image (Docker Hub tag from deploy-backend-java workflow)."
  default     = "uphiller/everycart:backend_java"
}

variable "backend_host_header" {
  type        = string
  description = "Hostname for the Spring API (no scheme): ALB listener rule host condition."
  default     = "api.bettercodelab.com"
}

variable "backend_container_port" {
  type        = number
  description = "Port the Spring Boot app listens on inside the container."
  default     = 8081
}

variable "backend_task_cpu" {
  type        = number
  description = "Fargate CPU units for the backend task."
  default     = 512
}

variable "backend_task_memory" {
  type        = number
  description = "Fargate memory (MB) for the backend task."
  default     = 1024
}

variable "backend_desired_count" {
  type        = number
  description = "Desired task count for the backend ECS service."
  default     = 1
}

variable "backend_spring_profiles_active" {
  type        = string
  description = "SPRING_PROFILES_ACTIVE for the backend container (application-<profile>.yml)."
  default     = "dev"
}

variable "backend_keycloak_user_client_id" {
  type        = string
  description = "EVERYCART_KEYCLOAK_USER_CLIENT_ID — Keycloak public client for password grant."
  default     = "web"
}

variable "backend_db_password" {
  type        = string
  description = "Postgres password for backend when backend_db_password_secret_arn is empty. Falls back to keycloak_db_password when both backend fields are empty."
  sensitive   = true
  default     = ""
}

variable "backend_db_password_secret_arn" {
  type        = string
  description = "Inject backend_java_db_password from SSM or Secrets Manager. When empty, uses keycloak_db_password_secret_arn if set."
  default     = ""
}

variable "backend_keycloak_admin_password_secret_arn" {
  type        = string
  description = "Inject KEYCLOAK_ADMIN_PASSWORD for backend Keycloak Admin API. When empty, uses keycloak_admin_password_secret_arn if set."
  default     = ""
}
