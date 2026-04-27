package com.everycart.keycloak;

import com.everycart.auth.dto.RefreshTokenRequest;
import com.everycart.auth.dto.TokenIssueRequest;
import com.everycart.auth.dto.TokenIssueResponse;
import feign.FeignException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class KeycloakUserTokenService {

    private final KeycloakAdminProperties props;
    private final KeycloakApiClient keycloakApiClient;

    public KeycloakUserTokenService(KeycloakAdminProperties props, KeycloakApiClient keycloakApiClient) {
        this.props = props;
        this.keycloakApiClient = keycloakApiClient;
    }

    public TokenIssueResponse issueUserToken(TokenIssueRequest request) {
        return fetchUserToken(userTokenFormBody(request), "아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    public TokenIssueResponse refreshUserToken(RefreshTokenRequest request) {
        return fetchUserToken(
                appendClientSecretIfNeeded(refreshTokenFormBody(request)),
                "리프레시 토큰이 유효하지 않거나 만료되었습니다.");
    }

    private TokenIssueResponse fetchUserToken(String formBody, String badRequestMessage) {
        try {
            KeycloakTokenResponse token = keycloakApiClient.fetchToken(props.realm(), formBody);
            if (token == null || token.accessToken() == null || token.accessToken().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Keycloak에서 토큰을 받지 못했습니다.");
            }
            Long expiresIn = token.expiresIn() == null ? null : token.expiresIn().longValue();
            return new TokenIssueResponse(
                    token.accessToken(), token.refreshToken(), expiresIn, token.tokenType());
        } catch (FeignException e) {
            int status = e.status();
            if (status == HttpStatus.UNAUTHORIZED.value()
                    || status == HttpStatus.BAD_REQUEST.value()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, badRequestMessage, e);
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Keycloak 토큰 발급에 실패했습니다.", e);
        }
    }

    private String userTokenFormBody(TokenIssueRequest request) {
        return appendClientSecretIfNeeded(
                "grant_type="
                        + enc("password")
                        + "&client_id="
                        + enc(props.userTokenClientId())
                        + "&username="
                        + enc(request.username())
                        + "&password="
                        + enc(request.password()));
    }

    private String refreshTokenFormBody(RefreshTokenRequest request) {
        return "grant_type="
                + enc("refresh_token")
                + "&client_id="
                + enc(props.userTokenClientId())
                + "&refresh_token="
                + enc(request.refreshToken());
    }

    private String appendClientSecretIfNeeded(String form) {
        String secret = props.userTokenClientSecret();
        if (secret == null || secret.isBlank()) {
            return form;
        }
        return form + "&client_secret=" + enc(secret);
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
