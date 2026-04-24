package com.everycart.keycloak;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "everycart.keycloak")
public record KeycloakAdminProperties(
        @NotBlank String serverUrl,
        @NotBlank String realm,
        @NotBlank String adminTokenRealm,
        @NotBlank String adminClientId,
        @NotBlank String adminUsername,
        @NotBlank String adminPassword,
        /** realm 사용자 password grant 용 public 클라이언트 (Direct access grants ON) */
        @NotBlank String userTokenClientId) {

    public KeycloakAdminProperties {
        serverUrl = serverUrl.endsWith("/") ? serverUrl.substring(0, serverUrl.length() - 1) : serverUrl;
    }
}
