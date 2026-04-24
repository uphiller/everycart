package com.everycart.keycloak;

import com.everycart.auth.RegisterRequest;
import com.everycart.auth.RegisterResponse;
import feign.FeignException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class KeycloakRegistrationService {

    private final KeycloakAdminProperties props;
    private final KeycloakApiClient keycloakApiClient;

    public KeycloakRegistrationService(KeycloakAdminProperties props, KeycloakApiClient keycloakApiClient) {
        this.props = props;
        this.keycloakApiClient = keycloakApiClient;
    }

    public RegisterResponse register(RegisterRequest request) {
        String accessToken = fetchAdminAccessToken();
        return createUser(accessToken, request);
    }

    private String fetchAdminAccessToken() {
        String formBody = tokenRequestFormBody();
        try {
            KeycloakTokenResponse token = keycloakApiClient.fetchToken(props.adminTokenRealm(), formBody);
            if (token == null || token.accessToken() == null || token.accessToken().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY, "Keycloak에서 관리자 토큰을 받지 못했습니다.");
            }
            return token.accessToken();
        } catch (FeignException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Keycloak 관리자 로그인에 실패했습니다. 계정·클라이언트 설정과 Direct access grants 여부를 확인하세요.",
                    e);
        }
    }

    private String tokenRequestFormBody() {
        return "grant_type="
                + enc("password")
                + "&client_id="
                + enc(props.adminClientId())
                + "&username="
                + enc(props.adminUsername())
                + "&password="
                + enc(props.adminPassword());
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private RegisterResponse createUser(String accessToken, RegisterRequest request) {
        Map<String, Object> body =
                Map.of(
                        "username",
                        request.username(),
                        "email",
                        request.email(),
                        "enabled",
                        true,
                        "credentials",
                        List.of(
                                Map.of(
                                        "type",
                                        "password",
                                        "value",
                                        request.password(),
                                        "temporary",
                                        false)));

        try {
            URI location =
                    keycloakApiClient
                            .createUser(props.realm(), "Bearer " + accessToken, body)
                            .getHeaders()
                            .getLocation();
            if (location == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Keycloak 사용자 생성 응답에 Location 이 없습니다.");
            }
            String id = location.getPath().substring(location.getPath().lastIndexOf('/') + 1);
            return new RegisterResponse(id, request.username(), request.email());
        } catch (FeignException e) {
            int status = e.status();
            if (status == HttpStatus.CONFLICT.value()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "이미 사용 중인 사용자 이름 또는 이메일입니다.", e);
            }
            if (status == HttpStatus.BAD_REQUEST.value()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Keycloak이 요청을 거절했습니다.", e);
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Keycloak 사용자 생성에 실패했습니다.", e);
        }
    }
}
