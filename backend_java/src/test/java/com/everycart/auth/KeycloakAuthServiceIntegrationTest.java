package com.everycart.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.everycart.keycloak.KeycloakRegistrationService;
import com.everycart.keycloak.KeycloakUserTokenService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

/**
 * Keycloak 연동 서비스 계층만 검증합니다 (HTTP 레이어 없음).
 *
 * <p>실행: {@code ./gradlew integrationTest}
 */
@SpringBootTest
@ActiveProfiles("integration")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Execution(ExecutionMode.SAME_THREAD)
class KeycloakAuthServiceIntegrationTest {

    private static final String TEST_PASSWORD = "IntegrationTest1!";

    @Autowired
    private KeycloakRegistrationService keycloakRegistrationService;

    @Autowired
    private KeycloakUserTokenService keycloakUserTokenService;

    @Autowired
    private Validator validator;

    private static String registeredUsername="it-user-001109a3";
    private static String registeredEmail;

    @Test
    @Order(1)
    @DisplayName("KeycloakRegistrationService — 사용자 생성")
    void registerCreatesUserInKeycloak() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        registeredUsername = "it-user-" + suffix;
        registeredEmail = "it-" + suffix + "@example.com";

        RegisterResponse response =
                keycloakRegistrationService.register(
                        new RegisterRequest(registeredUsername, registeredEmail, TEST_PASSWORD));

        assertThat(response.id()).isNotBlank();
        assertThat(response.username()).isEqualTo(registeredUsername);
        assertThat(response.email()).isEqualTo(registeredEmail);
    }

    @Test
    @Order(2)
    @DisplayName("KeycloakUserTokenService — 기존 사용자 토큰 발급")
    void issueTokenForExistingUser() {
        assertThat(registeredUsername).isNotNull();

        TokenIssueResponse token =
                keycloakUserTokenService.issueUserToken(
                        new TokenIssueRequest(registeredUsername, TEST_PASSWORD));

        assertThat(token.accessToken()).isNotBlank();
        assertThat(token.tokenType()).isEqualToIgnoringCase("Bearer");
    }

    @Test
    @Order(3)
    @DisplayName("KeycloakUserTokenService — refresh token 으로 재발급")
    void refreshTokenReissues() {
        assertThat(registeredUsername).isNotNull();

        TokenIssueResponse first =
                keycloakUserTokenService.issueUserToken(
                        new TokenIssueRequest(registeredUsername, TEST_PASSWORD));
        assertThat(first.refreshToken()).isNotBlank();

        TokenIssueResponse second =
                keycloakUserTokenService.refreshUserToken(
                        new RefreshTokenRequest(first.refreshToken()));
        assertThat(second.accessToken()).isNotBlank();
        assertThat(second.tokenType()).isEqualToIgnoringCase("Bearer");
    }

    @Test
    @Order(4)
    @DisplayName("KeycloakUserTokenService — 잘못된 자격증명이면 401")
    void issueTokenFailsWithBadCredentials() {
        assertThatThrownBy(
                        () ->
                                keycloakUserTokenService.issueUserToken(
                                        new TokenIssueRequest(
                                                "nobody-" + UUID.randomUUID(), "wrong-password")))
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @Order(5)
    @DisplayName("RegisterRequest — Bean Validation")
    void registerRequestValidation() {
        RegisterRequest invalid = new RegisterRequest("ab", "a@b.com", "short");
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(invalid);
        assertThat(violations).isNotEmpty();
    }

    @Test
    @Order(6)
    @DisplayName("TokenIssueRequest — Bean Validation")
    void tokenIssueRequestValidation() {
        TokenIssueRequest invalid = new TokenIssueRequest("", "x");
        Set<ConstraintViolation<TokenIssueRequest>> violations = validator.validate(invalid);
        assertThat(violations).isNotEmpty();
    }
}
