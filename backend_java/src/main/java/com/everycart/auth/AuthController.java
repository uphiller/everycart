package com.everycart.auth;

import com.everycart.auth.dto.*;
import com.everycart.config.OpenApiConfig;
import com.everycart.keycloak.KeycloakRegistrationService;
import com.everycart.keycloak.KeycloakUserTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "auth", description = "인증·회원 (Keycloak 연동)")
public class AuthController {

    private final KeycloakRegistrationService keycloakRegistrationService;
    private final KeycloakUserTokenService keycloakUserTokenService;

    public AuthController(
            KeycloakRegistrationService keycloakRegistrationService,
            KeycloakUserTokenService keycloakUserTokenService) {
        this.keycloakRegistrationService = keycloakRegistrationService;
        this.keycloakUserTokenService = keycloakUserTokenService;
    }

    @PostMapping("/token")
    @Operation(summary = "토큰 발급", description = "기존 realm 사용자 — Keycloak password grant (Direct access client 필요)")
    @ApiResponse(responseCode = "200", description = "accessToken 등 반환")
    @ApiResponse(responseCode = "401", description = "잘못된 자격증명")
    public TokenIssueResponse issueToken(@Valid @RequestBody TokenIssueRequest request) {
        return keycloakUserTokenService.issueUserToken(request);
    }

    @PostMapping("/token/refresh")
    @Operation(
            summary = "토큰 갱신",
            description = "Keycloak refresh_token grant — access·refresh 토큰 재발급 (클라이언트는 password 발급과 동일)")
    @ApiResponse(responseCode = "200", description = "accessToken, refreshToken 등 반환")
    @ApiResponse(responseCode = "401", description = "리프레시 토큰 무효·만료")
    public TokenIssueResponse refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return keycloakUserTokenService.refreshUserToken(request);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "회원가입",
            description = "Keycloak Admin API로 realm에 사용자를 생성합니다. (관리자 클라이언트/계정 설정 필요)")
    @ApiResponse(responseCode = "201", description = "생성됨")
    @ApiResponse(responseCode = "409", description = "이미 사용 중인 사용자명/이메일")
    @ApiResponse(responseCode = "502", description = "Keycloak 연동 실패")
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return keycloakRegistrationService.register(request);
    }

    @GetMapping("/me")
    @Operation(summary = "현재 사용자", description = "Keycloak access token (JWT) 기준")
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    @ApiResponse(responseCode = "200", description = "로그인 사용자 클레임")
    @ApiResponse(responseCode = "401", description = "토큰 없음 또는 유효하지 않음")
    public AuthUserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return new AuthUserResponse(
                jwt.getSubject(),
                jwt.getClaimAsString("preferred_username"),
                jwt.getClaimAsString("email"),
                realmRoles(jwt));
    }

    @SuppressWarnings("unchecked")
    private static Set<String> realmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) {
            return Set.of();
        }
        Object roles = realmAccess.get("roles");
        if (!(roles instanceof List<?> list)) {
            return Set.of();
        }
        return list.stream().map(Object::toString).collect(Collectors.toUnmodifiableSet());
    }
}
