package com.lankafresh.supermarket.repository;

import com.lankafresh.supermarket.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByIsDiscontinuedFalse();
    List<Product> findByCategoryIdAndIsDiscontinuedFalse(Long categoryId);
    long countByCategoryId(Long categoryId);

    @Query("SELECT p FROM Product p WHERE p.isDiscontinued = false AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProducts(@Param("query") String query);

    @Query("SELECT p FROM Product p WHERE p.stockQuantity <= p.reorderLevel AND p.isDiscontinued = false")
    List<Product> findLowStockProducts();
}
