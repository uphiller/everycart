locals {
  name = var.project_name

  alb_hostnames = distinct(compact([var.alb_host_header, var.keycloak_host_header]))

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
