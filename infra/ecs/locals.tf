locals {
  name = var.project_name

  alb_hostnames = distinct(compact([
    var.alb_host_header,
    var.keycloak_host_header,
    var.backend_host_header,
  ]))

  acm_primary_domain = trimspace(var.acm_primary_domain) != "" ? var.acm_primary_domain : local.alb_hostnames[0]
  acm_subject_alternative_names = [
    for host in local.alb_hostnames : host if host != local.acm_primary_domain
  ]

  create_acm_certificate = var.enable_https && trimspace(var.acm_certificate_arn) == ""

  alb_certificate_arn = trimspace(var.acm_certificate_arn) != "" ? trimspace(var.acm_certificate_arn) : (
    local.create_acm_certificate ? aws_acm_certificate.main[0].arn : ""
  )

  alb_listener_arn = var.enable_https ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn

  # Hostname v2: public HTTPS URL (edge TLS at CDN/ALB). ALB→container is HTTP; KC_PROXY_HEADERS=xforwarded.
  # KC_HOSTNAME_ADMIN fixes Admin Console /resources/* being emitted as http:// (Mixed Content).
  keycloak_hostname_url = "https://${var.keycloak_host_header}"

  # Supabase / external Postgres: production start; start-dev ignores KC_DB_*.
  keycloak_container_command_effective = trimspace(var.keycloak_db_url) != "" && var.keycloak_container_command == ["start-dev"] ? ["start"] : var.keycloak_container_command

  keycloak_execution_secret_arns = distinct(compact([
    var.keycloak_admin_password_secret_arn,
    var.keycloak_db_password_secret_arn,
  ]))

  backend_db_password_secret_arn_effective = trimspace(var.backend_db_password_secret_arn) != "" ? trimspace(var.backend_db_password_secret_arn) : trimspace(var.keycloak_db_password_secret_arn)

  backend_keycloak_admin_password_secret_arn_effective = trimspace(var.backend_keycloak_admin_password_secret_arn) != "" ? trimspace(var.backend_keycloak_admin_password_secret_arn) : trimspace(var.keycloak_admin_password_secret_arn)

  backend_execution_secret_arns = distinct(compact([
    local.backend_db_password_secret_arn_effective,
    local.backend_keycloak_admin_password_secret_arn_effective,
  ]))

  ecs_execution_secret_arns = distinct(compact(concat(
    local.keycloak_execution_secret_arns,
    local.backend_execution_secret_arns,
  )))

  ecs_execution_sm_arns = [
    for arn in local.ecs_execution_secret_arns : arn if startswith(arn, "arn:aws:secretsmanager:")
  ]

  ecs_execution_ssm_arns = [
    for arn in local.ecs_execution_secret_arns : arn if startswith(arn, "arn:aws:ssm:")
  ]

  keycloak_ecs_plain_env_admin_password = trimspace(var.keycloak_admin_password_secret_arn) == "" ? [
    {
      name  = "KC_BOOTSTRAP_ADMIN_PASSWORD"
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
      {
        name  = "KC_DB_SCHEMA"
        value = var.keycloak_db_schema
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
      { name = "KC_HOSTNAME_ADMIN", value = local.keycloak_hostname_url },
      { name = "KC_HOSTNAME_STRICT", value = "true" },
      { name = "KC_BOOTSTRAP_ADMIN_USERNAME", value = var.keycloak_admin_username },
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
      command   = local.keycloak_container_command_effective
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

  backend_db_password_effective = trimspace(var.backend_db_password) != "" ? var.backend_db_password : var.keycloak_db_password

  backend_ecs_plain_env = concat(
    [
      { name = "SPRING_PROFILES_ACTIVE", value = var.backend_spring_profiles_active },
      { name = "KEYCLOAK_ADMIN_USERNAME", value = var.keycloak_admin_username },
      { name = "EVERYCART_KEYCLOAK_USER_CLIENT_ID", value = var.backend_keycloak_user_client_id },
    ],
    local.backend_db_password_secret_arn_effective == "" && trimspace(local.backend_db_password_effective) != "" ? [
      { name = "backend_java_db_password", value = local.backend_db_password_effective },
    ] : [],
    local.backend_keycloak_admin_password_secret_arn_effective == "" && trimspace(var.keycloak_admin_password) != "" ? [
      { name = "KEYCLOAK_ADMIN_PASSWORD", value = var.keycloak_admin_password },
    ] : [],
  )

  backend_ecs_secrets = concat(
    local.backend_db_password_secret_arn_effective != "" ? [
      {
        name      = "backend_java_db_password"
        valueFrom = local.backend_db_password_secret_arn_effective
      },
    ] : [],
    local.backend_keycloak_admin_password_secret_arn_effective != "" ? [
      {
        name      = "KEYCLOAK_ADMIN_PASSWORD"
        valueFrom = local.backend_keycloak_admin_password_secret_arn_effective
      },
    ] : [],
  )

  backend_container_definition = merge(
    {
      name      = "${local.name}-backend"
      image     = var.backend_container_image
      essential = true
      portMappings = [
        {
          containerPort = var.backend_container_port
          protocol      = "tcp"
        }
      ]
      environment = local.backend_ecs_plain_env
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    },
    length(local.backend_ecs_secrets) > 0 ? { secrets = local.backend_ecs_secrets } : {},
  )

  frontend_api_base_url = "https://${var.backend_host_header}"

  frontend_ecs_plain_env = [
    { name = "API_BASE_URL", value = local.frontend_api_base_url },
  ]
}
