package com.everycart.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Swagger UI / OpenAPI 는 JWT 인증을 적용하지 않습니다. (Bearer 토큰이 잘못·만료돼도 UI 로딩 가능)
     * Resource Server 가 모든 요청에 대해 JWT 를 검사하면 공개 URL 에서 401 이 날 수 있어 ignoring 처리합니다.
     */
    @Bean
    WebSecurityCustomizer webSecurityCustomizer() {
        return web ->
                web.ignoring()
                        .requestMatchers(
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/webjars/**");
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, CorsProperties corsProperties)
            throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.cors(Customizer.withDefaults());
        http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.authorizeHttpRequests(
                auth ->
                        auth.requestMatchers("/actuator/health", "/actuator/health/**")
                                .permitAll()
                                .requestMatchers(
                                        "/v3/api-docs",
                                        "/v3/api-docs/**",
                                        "/swagger-ui/**",
                                        "/swagger-ui.html")
                                .permitAll()
                                .requestMatchers(
                                                HttpMethod.POST,
                                                "/api/auth/register",
                                                "/api/auth/token",
                                                "/api/auth/token/refresh")
                                        .permitAll()
                                .requestMatchers("/api/**")
                                .authenticated()
                                .anyRequest()
                                .denyAll());
        http.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(CorsProperties corsProperties) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(corsProperties.allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
