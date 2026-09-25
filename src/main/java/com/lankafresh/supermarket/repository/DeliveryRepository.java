package com.lankafresh.supermarket.repository;

import com.lankafresh.supermarket.entity.Delivery;
import com.lankafresh.supermarket.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByOrderId(Long orderId);
    List<Delivery> findByDeliveryStaffId(Long deliveryStaffId);
    List<Delivery> findByStatus(DeliveryStatus status);
}
