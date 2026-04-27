package com.everycart.auth.dto;

import java.util.Set;

public record AuthUserResponse(
        String subject,
        String preferredUsername,
        String email,
        Set<String> realmRoles) {}
