package com.everycart.auth;

import java.util.Set;

public record AuthUserResponse(
        String subject,
        String preferredUsername,
        String email,
        Set<String> realmRoles) {}
