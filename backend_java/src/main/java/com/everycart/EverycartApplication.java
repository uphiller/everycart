package com.everycart;

import com.everycart.config.CorsProperties;
import com.everycart.keycloak.KeycloakAdminProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.everycart.keycloak")
@EnableConfigurationProperties({CorsProperties.class, KeycloakAdminProperties.class})
public class EverycartApplication {

    public static void main(String[] args) {
        SpringApplication.run(EverycartApplication.class, args);
    }
}
