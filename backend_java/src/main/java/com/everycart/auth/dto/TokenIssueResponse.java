package com.everycart.auth.dto;

public record TokenIssueResponse(
        String accessToken, String refreshToken, Long expiresIn, String tokenType) {}
