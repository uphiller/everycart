package com.everycart.cart.dto;

import java.util.List;

public record CartResponse(List<CartItemResponse> items, int totalQuantity) {}
