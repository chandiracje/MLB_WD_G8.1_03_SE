package com.lankafresh.supermarket.service;

import com.lankafresh.supermarket.entity.*;
import com.lankafresh.supermarket.repository.DeliveryRepository;
import com.lankafresh.supermarket.repository.OrderRepository;
import com.lankafresh.supermarket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAll();
    }

    public List<Delivery> getDeliveriesByStaff(Long staffId) {
        return deliveryRepository.findByDeliveryStaffId(staffId);
    }

    @Transactional
    public Delivery assignStaff(Long deliveryId, Long staffId, LocalDateTime estimatedTime) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Delivery staff not found"));

        delivery.setDeliveryStaff(staff);
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setEstimatedTime(estimatedTime);

        // Update corresponding order status to SHIPPED
        Order order = delivery.getOrder();
        order.setStatus(OrderStatus.SHIPPED);
        orderRepository.save(order);

        return deliveryRepository.save(delivery);
    }

    @Transactional
    public Delivery updateStatus(Long deliveryId, DeliveryStatus status, String notes) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        delivery.setStatus(status);
        if (notes != null) {
            delivery.setNotes(notes);
        }

        if (status == DeliveryStatus.DELIVERED) {
            delivery.setActualTime(LocalDateTime.now());
            Order order = delivery.getOrder();
            order.setStatus(OrderStatus.DELIVERED);
            orderRepository.save(order);
        }

        return deliveryRepository.save(delivery);
    }
}
