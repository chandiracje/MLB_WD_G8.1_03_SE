package com.lankafresh.supermarket.controller;

import com.lankafresh.supermarket.entity.Wishlist;
import com.lankafresh.supermarket.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<Wishlist>> getWishlist(@PathVariable Long userId) {
        return ResponseEntity.ok(wishlistService.getWishlistByUser(userId));
    }

    @PostMapping("/{userId}/{productId}")
    public ResponseEntity<?> addToWishlist(@PathVariable Long userId, @PathVariable Long productId) {
        try {
            Wishlist item = wishlistService.addToWishlist(userId, productId);
            return ResponseEntity.ok(item);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}/{productId}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable Long userId, @PathVariable Long productId) {
        try {
            wishlistService.removeFromWishlist(userId, productId);
            return ResponseEntity.ok(Map.of("message", "Removed from wishlist"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
