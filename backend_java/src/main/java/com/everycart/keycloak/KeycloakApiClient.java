package com.everycart.keycloak;

import java.util.Map;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "keycloak", url = "${everycart.keycloak.server-url}")
public interface KeycloakApiClient {

    /**
     * OpenFeign 은 {@code x-www-form-urlencoded} 에서 {@link org.springframework.util.MultiValueMap} /
     * {@code @RequestParam} 조합이 본문 없이 나가는 경우가 있어, 인코딩된 문자열 본문으로 보냅니다.
     */
    @PostMapping(
            value = "/realms/{realm}/protocol/openid-connect/token",
            consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    KeycloakTokenResponse fetchToken(@PathVariable("realm") String realm, @RequestBody String formBody);

    @PostMapping(
            value = "/admin/realms/{realm}/users",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<Void> createUser(
            @PathVariable("realm") String realm,
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> body);
}
