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
