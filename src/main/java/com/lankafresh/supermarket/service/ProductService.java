package com.lankafresh.supermarket.service;

import com.lankafresh.supermarket.dto.CategoryRequest;
import com.lankafresh.supermarket.dto.StockAdjustmentRequest;
import com.lankafresh.supermarket.entity.*;
import com.lankafresh.supermarket.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final UserRepository userRepository;
    private final PromotionRepository promotionRepository;

    public List<Product> getAllProducts() {
        return productRepository.findByIsDiscontinuedFalse();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    public List<Product> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryIdAndIsDiscontinuedFalse(categoryId);
    }

    public List<Product> searchProducts(String query) {
        return productRepository.searchProducts(query);
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    @Transactional
    public Product createProduct(Product product, Long categoryId) {
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId).orElse(null);
            product.setCategory(category);
        }
        product.setIsDiscontinued(false);
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, Product updatedProduct, Long categoryId) {
        Product product = getProductById(id);
        product.setName(updatedProduct.getName());
        product.setDescription(updatedProduct.getDescription());
        product.setPrice(updatedProduct.getPrice());
        product.setUnit(updatedProduct.getUnit());
        product.setStockQuantity(updatedProduct.getStockQuantity());
        product.setReorderLevel(updatedProduct.getReorderLevel());
        product.setImageUrl(updatedProduct.getImageUrl());
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId).orElse(null);
            product.setCategory(category);
        }
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setIsDiscontinued(true);
        productRepository.save(product);
    }

    @Transactional
    public Product adjustStock(Long productId, Long userId, String email, StockAdjustmentRequest request) {
        Product product = getProductById(productId);

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }
        if (user == null && email != null && !email.trim().isEmpty()) {
            user = userRepository.findByEmail(email.trim()).orElse(null);
        }
        if (user == null) {
            // Fallback: try finding an inventory staff member
            List<User> inventoryStaff = userRepository.findByRole(UserRole.INVENTORY_STAFF);
            if (!inventoryStaff.isEmpty()) {
                user = inventoryStaff.get(0);
            }
        }
        if (user == null) {
            // Fallback: try finding a manager
            List<User> managers = userRepository.findByRole(UserRole.MANAGER);
            if (!managers.isEmpty()) {
                user = managers.get(0);
            }
        }
        if (user == null) {
            // Final fallback: any registered user in the database
            user = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("No user record found in database to log stock adjustment."));
        }

        int newStock = (product.getStockQuantity() != null ? product.getStockQuantity() : 0) + request.getQuantityChange();
        if (newStock < 0) {
            throw new RuntimeException("Stock cannot be negative. Current stock is " + product.getStockQuantity());
        }
        product.setStockQuantity(newStock);
        productRepository.save(product);

        StockAdjustment adjustment = StockAdjustment.builder()
                .product(product)
                .adjustedBy(user)
                .quantityChange(request.getQuantityChange())
                .reason(request.getReason())
                .build();
        stockAdjustmentRepository.save(adjustment);

        return product;
    }

    @Transactional
    public Product adjustStock(Long productId, Long userId, StockAdjustmentRequest request) {
        return adjustStock(productId, userId, null, request);
    }

    public List<StockAdjustment> getAdjustmentHistory(Long productId) {
        if (productId != null) {
            return stockAdjustmentRepository.findByProductIdOrderByCreatedAtDesc(productId);
        }
        return stockAdjustmentRepository.findAllByOrderByCreatedAtDesc();
    }

    // ─── Category CRUD ───────────────────────────────────────────────────────────

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional
    public Category createCategory(CategoryRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Category name cannot be empty.");
        }
        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found with id: " + request.getParentId()));
        }
        Category category = Category.builder()
                .name(request.getName().trim())
                .parent(parent)
                .build();
        return categoryRepository.save(category);
    }

    @Transactional
    public Category updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Category name cannot be empty.");
        }
        category.setName(request.getName().trim());

        if (request.getParentId() == null) {
            category.setParent(null);
        } else {
            if (request.getParentId().equals(id)) {
                throw new RuntimeException("A category cannot be its own parent.");
            }
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found with id: " + request.getParentId()));
            category.setParent(parent);
        }
        return categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        // Check for sub-categories
        if (categoryRepository.existsByParentId(id)) {
            throw new RuntimeException("Cannot delete category \"" + category.getName() + "\" because it has sub-categories. Delete or reassign them first.");
        }
        // Check for products assigned to this category
        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new RuntimeException("Cannot delete category \"" + category.getName() + "\" because " + productCount + " product(s) are assigned to it. Reassign them first.");
        }
        categoryRepository.delete(category);
    }

    // ─── Promotions ──────────────────────────────────────────────────────────────

    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    public List<Promotion> getActivePromotions() {
        return promotionRepository.findByIsActiveTrue();
    }

    public Promotion createPromotion(Promotion promotion) {
        if (promotion.getIsActive() == null) {
            promotion.setIsActive(true);
        }
        if (promotion.getStartDate() == null) {
            promotion.setStartDate(java.time.LocalDateTime.now());
        }
        if (promotion.getEndDate() == null) {
            promotion.setEndDate(java.time.LocalDateTime.now().plusDays(30));
        }
        if (promotion.getCode() != null) {
            promotion.setCode(promotion.getCode().trim().toUpperCase());
        }
        return promotionRepository.save(promotion);
    }

    public Promotion updatePromotion(Long id, Promotion updated) {
        Promotion existing = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promotion not found with ID: " + id));

        if (updated.getName() != null) {
            existing.setName(updated.getName().trim());
        }
        if (updated.getDescription() != null) {
            existing.setDescription(updated.getDescription());
        }
        if (updated.getDiscountPercentage() != null) {
            existing.setDiscountPercentage(updated.getDiscountPercentage());
        }
        if (updated.getCode() != null) {
            existing.setCode(updated.getCode().trim().toUpperCase());
        }
        if (updated.getStartDate() != null) {
            existing.setStartDate(updated.getStartDate());
        }
        if (updated.getEndDate() != null) {
            existing.setEndDate(updated.getEndDate());
        }
        if (updated.getIsActive() != null) {
            existing.setIsActive(updated.getIsActive());
        }

        return promotionRepository.save(existing);
    }

    public void deletePromotion(Long id) {
        if (!promotionRepository.existsById(id)) {
            throw new RuntimeException("Promotion not found with ID: " + id);
        }
        promotionRepository.deleteById(id);
    }
}
