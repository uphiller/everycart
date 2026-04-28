package com.everycart.cart;

import com.everycart.cart.dto.AddCartItemRequest;
import com.everycart.cart.dto.CartItemResponse;
import com.everycart.cart.dto.CartResponse;
import com.everycart.cart.dto.UpdateCartItemRequest;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final CartRepository cartRepository;

    public CartService(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(String userSub) {
        return cartRepository.findByUserSub(userSub).map(this::toResponse).orElse(emptyCart());
    }

    @Transactional
    public CartResponse addItem(String userSub, AddCartItemRequest request) {
        Cart cart = cartRepository.findByUserSub(userSub).orElseGet(() -> cartRepository.save(new Cart(userSub)));

        cart.findItemByProductId(request.productId())
                .ifPresentOrElse(
                        item -> item.setQuantity(item.getQuantity() + request.quantity()),
                        () -> cart.addItem(new CartItem(cart, request.productId(), request.quantity())));

        return toResponse(cart);
    }

    @Transactional
    public CartResponse updateItemQuantity(String userSub, String productId, UpdateCartItemRequest request) {
        Cart cart = cartRepository.findByUserSub(userSub).orElseGet(() -> cartRepository.save(new Cart(userSub)));

        cart.findItemByProductId(productId)
                .ifPresent(
                        item -> {
                            if (request.quantity() == 0) {
                                cart.removeItem(item);
                            } else {
                                item.setQuantity(request.quantity());
                            }
                        });

        return toResponse(cart);
    }

    @Transactional
    public CartResponse removeItem(String userSub, String productId) {
        Cart cart = cartRepository.findByUserSub(userSub).orElseGet(() -> cartRepository.save(new Cart(userSub)));
        cart.findItemByProductId(productId).ifPresent(cart::removeItem);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse clearCart(String userSub) {
        Cart cart = cartRepository.findByUserSub(userSub).orElseGet(() -> cartRepository.save(new Cart(userSub)));
        cart.getItems().clear();
        return toResponse(cart);
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items =
                cart.getItems().stream()
                        .sorted(Comparator.comparing(CartItem::getId, Comparator.nullsLast(Long::compareTo)))
                        .map(item -> new CartItemResponse(item.getProductId(), item.getQuantity()))
                        .toList();

        int totalQuantity = items.stream().mapToInt(CartItemResponse::quantity).sum();
        return new CartResponse(items, totalQuantity);
    }

    private static CartResponse emptyCart() {
        return new CartResponse(List.of(), 0);
    }
}
