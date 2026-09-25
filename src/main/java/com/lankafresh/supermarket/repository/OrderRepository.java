package com.lankafresh.supermarket.repository;

import com.lankafresh.supermarket.entity.Order;
import com.lankafresh.supermarket.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);
    List<Order> findAllByOrderByOrderDateDesc();
    List<Order> findByStatus(OrderStatus status);
    Optional<Order> findByTrackingNumber(String trackingNumber);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status != 'CANCELLED' AND o.status != 'REFUNDED'")
    BigDecimal calculateTotalRevenue();
}
