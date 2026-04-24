package com.everycart.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TokenIssueRequest(
        @NotBlank @Size(max = 128) String username, @NotBlank @Size(max = 256) String password) {}
