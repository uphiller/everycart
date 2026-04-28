package com.everycart.cart;

import com.everycart.cart.dto.AddCartItemRequest;
import com.everycart.cart.dto.CartResponse;
import com.everycart.cart.dto.UpdateCartItemRequest;
import com.everycart.config.OpenApiConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
@Tag(name = "cart", description = "장바구니")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @Operation(summary = "장바구니 조회")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    public CartResponse getCart(@AuthenticationPrincipal Jwt jwt) {
        return cartService.getCart(jwt.getSubject());
    }

    @PostMapping("/items")
    @Operation(summary = "장바구니 상품 담기")
    @ApiResponse(responseCode = "200", description = "추가 성공")
    public CartResponse addItem(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AddCartItemRequest request) {
        return cartService.addItem(jwt.getSubject(), request);
    }

    @PatchMapping("/items/{productId}")
    @Operation(summary = "장바구니 수량 변경 (0이면 제거)")
    @ApiResponse(responseCode = "200", description = "변경 성공")
    public CartResponse updateItemQuantity(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        return cartService.updateItemQuantity(jwt.getSubject(), productId, request);
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "장바구니 특정 상품 제거")
    @ApiResponse(responseCode = "200", description = "제거 성공")
    public CartResponse removeItem(@AuthenticationPrincipal Jwt jwt, @PathVariable String productId) {
        return cartService.removeItem(jwt.getSubject(), productId);
    }

    @DeleteMapping
    @Operation(summary = "장바구니 비우기")
    @ApiResponse(responseCode = "200", description = "비우기 성공")
    public CartResponse clearCart(@AuthenticationPrincipal Jwt jwt) {
        return cartService.clearCart(jwt.getSubject());
    }
}
