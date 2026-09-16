package com.lankafresh.supermarket.controller;

import com.lankafresh.supermarket.dto.CategoryRequest;
import com.lankafresh.supermarket.dto.StockAdjustmentRequest;
import com.lankafresh.supermarket.entity.*;
import com.lankafresh.supermarket.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(productService.searchProducts(search.trim()));
        }
        if (categoryId != null) {
            return ResponseEntity.ok(productService.getProductsByCategory(categoryId));
        }
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(productService.getProductById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody Product product, @RequestParam(required = false) Long categoryId) {
        try {
            return ResponseEntity.ok(productService.createProduct(product, categoryId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestBody Product product,
            @RequestParam(required = false) Long categoryId) {
        try {
            return ResponseEntity.ok(productService.updateProduct(id, product, categoryId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok(Map.of("message", "Product marked as discontinued"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/inventory/low-stock")
    public ResponseEntity<List<Product>> getLowStock() {
        return ResponseEntity.ok(productService.getLowStockProducts());
    }

    @PostMapping("/inventory/adjust/{productId}")
    public ResponseEntity<?> adjustStock(
            @PathVariable Long productId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String email,
            @RequestBody StockAdjustmentRequest request,
            java.security.Principal principal) {
        try {
            String resolvedEmail = (email != null && !email.trim().isEmpty())
                    ? email.trim()
                    : (principal != null ? principal.getName() : null);
            Product updated = productService.adjustStock(productId, userId, resolvedEmail, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/inventory/history")
    public ResponseEntity<List<StockAdjustment>> getAdjustmentHistory(@RequestParam(required = false) Long productId) {
        return ResponseEntity.ok(productService.getAdjustmentHistory(productId));
    }

    // ─── Category CRUD Endpoints ─────────────────────────────────────────────────

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(productService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<?> createCategory(@RequestBody CategoryRequest request) {
        try {
            return ResponseEntity.ok(productService.createCategory(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody CategoryRequest request) {
        try {
            return ResponseEntity.ok(productService.updateCategory(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            productService.deleteCategory(id);
            return ResponseEntity.ok(Map.of("message", "Category deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── Promotions ──────────────────────────────────────────────────────────────

    @GetMapping("/promotions")
    public ResponseEntity<List<Promotion>> getPromotions() {
        return ResponseEntity.ok(productService.getActivePromotions());
    }

    @PostMapping("/promotions")
    public ResponseEntity<Promotion> createPromotion(@RequestBody Promotion promotion) {
        return ResponseEntity.ok(productService.createPromotion(promotion));
    }
}
