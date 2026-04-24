package com.everycart.auth;

public record TokenIssueResponse(
        String accessToken, String refreshToken, Long expiresIn, String tokenType) {}
