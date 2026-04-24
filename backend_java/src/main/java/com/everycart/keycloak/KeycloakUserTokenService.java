package com.everycart.keycloak;

import com.everycart.auth.TokenIssueRequest;
import com.everycart.auth.TokenIssueResponse;
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
        String formBody = userTokenFormBody(request);
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
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다.", e);
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Keycloak 토큰 발급에 실패했습니다.", e);
        }
    }

    private String userTokenFormBody(TokenIssueRequest request) {
        return "grant_type="
                + enc("password")
                + "&client_id="
                + enc(props.userTokenClientId())
                + "&username="
                + enc(request.username())
                + "&password="
                + enc(request.password());
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
