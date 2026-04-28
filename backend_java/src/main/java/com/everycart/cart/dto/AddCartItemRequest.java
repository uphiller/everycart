package com.everycart.cart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record AddCartItemRequest(@NotBlank @Size(max = 64) String productId, @Positive int quantity) {}
