# DNS 가 Cloudflare 등 외부일 때: route53_zone_id 는 비우고 output cloudflare_dns_setup 으로
# 검증 CNAME 을 수동 추가한 뒤 인증서 ISSUED 후 전체 apply.

resource "aws_acm_certificate" "main" {
  count = local.create_acm_certificate ? 1 : 0

  domain_name               = local.acm_primary_domain
  subject_alternative_names = local.acm_subject_alternative_names
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${local.name}-alb"
  }
}

resource "aws_route53_record" "acm_validation" {
  for_each = local.create_acm_certificate && trimspace(var.route53_zone_id) != "" ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.route53_zone_id
}

resource "aws_acm_certificate_validation" "main" {
  count = local.create_acm_certificate && trimspace(var.route53_zone_id) != "" ? 1 : 0

  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for record in aws_route53_record.acm_validation : record.fqdn]
}

resource "aws_route53_record" "alb_alias" {
  for_each = var.create_route53_alias_records && trimspace(var.route53_zone_id) != "" ? toset(local.alb_hostnames) : toset([])

  zone_id = var.route53_zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
