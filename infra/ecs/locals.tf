locals {
  name = var.project_name

  # Hostname v2: public URL must include scheme. ALB uses HTTP only → fixed http:// base (no v1 hostname-strict-https).
  keycloak_hostname_url = "http://${var.keycloak_host_header}"

  keycloak_execution_secret_arns = distinct(compact([
    var.keycloak_admin_password_secret_arn,
    var.keycloak_db_password_secret_arn,
  ]))

  keycloak_execution_sm_arns = [
    for arn in local.keycloak_execution_secret_arns : arn if startswith(arn, "arn:aws:secretsmanager:")
  ]

  keycloak_execution_ssm_arns = [
    for arn in local.keycloak_execution_secret_arns : arn if startswith(arn, "arn:aws:ssm:")
  ]

  keycloak_ecs_plain_env_admin_password = trimspace(var.keycloak_admin_password_secret_arn) == "" ? [
    {
      name  = "KEYCLOAK_ADMIN_PASSWORD"
      value = var.keycloak_admin_password
    },
  ] : []

  keycloak_ecs_plain_env_db = trimspace(var.keycloak_db_url) == "" ? [] : concat(
    [
      {
        name  = "KC_DB"
        value = var.keycloak_db_kind
      },
      {
        name  = "KC_DB_URL"
        value = var.keycloak_db_url
      },
      {
        name  = "KC_DB_USERNAME"
        value = var.keycloak_db_username
      },
    ],
    trimspace(var.keycloak_db_password_secret_arn) == "" ? [
      {
        name  = "KC_DB_PASSWORD"
        value = var.keycloak_db_password
      },
    ] : [],
  )

  keycloak_ecs_plain_env_core = concat(
    [
      { name = "KC_HTTP_ENABLED", value = var.keycloak_http_enabled ? "true" : "false" },
      { name = "KC_PROXY_HEADERS", value = "xforwarded" },
      { name = "KC_HOSTNAME", value = local.keycloak_hostname_url },
      { name = "KC_HOSTNAME_STRICT", value = "false" },
      { name = "KEYCLOAK_ADMIN", value = var.keycloak_admin_username },
    ],
    local.keycloak_ecs_plain_env_admin_password,
    local.keycloak_ecs_plain_env_db,
  )

  keycloak_ecs_secrets = concat(
    trimspace(var.keycloak_admin_password_secret_arn) != "" ? [
      {
        name      = "KEYCLOAK_ADMIN_PASSWORD"
        valueFrom = var.keycloak_admin_password_secret_arn
      },
    ] : [],
    trimspace(var.keycloak_db_url) != "" && trimspace(var.keycloak_db_password_secret_arn) != "" ? [
      {
        name      = "KC_DB_PASSWORD"
        valueFrom = var.keycloak_db_password_secret_arn
      },
    ] : [],
  )

  keycloak_container_definition = merge(
    {
      name      = "${local.name}-keycloak"
      image     = var.keycloak_container_image
      essential = true
      command   = var.keycloak_container_command
      portMappings = [
        {
          containerPort = var.keycloak_container_port
          protocol      = "tcp"
        }
      ]
      environment = local.keycloak_ecs_plain_env_core
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "keycloak"
        }
      }
    },
    length(local.keycloak_ecs_secrets) > 0 ? { secrets = local.keycloak_ecs_secrets } : {},
  )
}
