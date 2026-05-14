resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${local.name}"
  retention_in_days = 14
}

resource "aws_ecs_cluster" "main" {
  name = "${local.name}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = {
    Name = "${local.name}-cluster"
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${local.name}-ecs-task-execution"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_keycloak_secrets" {
  count = length(local.keycloak_execution_secret_arns) > 0 ? 1 : 0
  name  = "${local.name}-ecs-exec-keycloak-secrets"
  role  = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      length(local.keycloak_execution_sm_arns) > 0 ? [
        {
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = local.keycloak_execution_sm_arns
        }
      ] : [],
      length(local.keycloak_execution_ssm_arns) > 0 ? [
        {
          Effect   = "Allow"
          Action   = ["ssm:GetParameters"]
          Resource = local.keycloak_execution_ssm_arns
        }
      ] : [],
    )
  })

  lifecycle {
    precondition {
      condition     = length(local.keycloak_execution_sm_arns) > 0 || length(local.keycloak_execution_ssm_arns) > 0
      error_message = "keycloak_admin_password_secret_arn and keycloak_db_password_secret_arn must be arn:aws:secretsmanager:... or arn:aws:ssm:... so the execution role can read them."
    }
  }
}

check "keycloak_db_username_when_jdbc" {
  assert {
    condition     = trimspace(var.keycloak_db_url) == "" || trimspace(var.keycloak_db_username) != ""
    error_message = "Set keycloak_db_username when keycloak_db_url is non-empty."
  }
}

resource "aws_ecs_task_definition" "main" {
  family                   = "${local.name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "${local.name}-app"
      image     = var.container_image
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "${local.name}-task"
  }
}

resource "aws_ecs_service" "main" {
  name            = "${local.name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "${local.name}-app"
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.http, aws_lb_listener_rule.ecs_host]

  tags = {
    Name = "${local.name}-service"
  }
}

resource "aws_ecs_task_definition" "keycloak" {
  family                   = "${local.name}-keycloak-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.keycloak_task_cpu
  memory                   = var.keycloak_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([local.keycloak_container_definition])

  tags = {
    Name = "${local.name}-keycloak-task"
  }
}

resource "aws_ecs_service" "keycloak" {
  name            = "${local.name}-keycloak-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.keycloak.arn
  desired_count   = var.keycloak_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.keycloak.arn
    container_name   = "${local.name}-keycloak"
    container_port   = var.keycloak_container_port
  }

  depends_on = [aws_lb_listener.http, aws_lb_listener_rule.keycloak_host]

  tags = {
    Name = "${local.name}-keycloak-service"
  }
}
