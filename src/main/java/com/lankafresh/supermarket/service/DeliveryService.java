package com.lankafresh.supermarket.service;

import com.lankafresh.supermarket.entity.*;
import com.lankafresh.supermarket.repository.DeliveryRepository;
import com.lankafresh.supermarket.repository.OrderRepository;
import com.lankafresh.supermarket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    @Transactional
    public void deleteDelivery(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + deliveryId));

        if (delivery.getStatus() != DeliveryStatus.DELIVERED && delivery.getStatus() != DeliveryStatus.FAILED) {
            throw new RuntimeException("Only resolved (DELIVERED) or FAILED delivery requests can be deleted.");
        }

        deliveryRepository.delete(delivery);
    }

    @Transactional
    public Delivery updateRouteAssignment(Long deliveryId, String routeName, Integer stopOrder, String vehicleNumber) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + deliveryId));

        if (routeName != null) delivery.setRouteName(routeName);
        if (stopOrder != null) delivery.setRouteStopOrder(stopOrder);
        if (vehicleNumber != null) delivery.setVehicleNumber(vehicleNumber);

        return deliveryRepository.save(delivery);
    }

    @Transactional
    public List<Delivery> batchAssignRoute(List<Map<String, Object>> routeItems) {
        List<Delivery> updatedList = new ArrayList<>();
        if (routeItems == null) return updatedList;

        for (Map<String, Object> item : routeItems) {
            if (!item.containsKey("deliveryId") || item.get("deliveryId") == null) continue;
            Long deliveryId = Long.valueOf(item.get("deliveryId").toString());
            Delivery delivery = deliveryRepository.findById(deliveryId)
                    .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + deliveryId));

            if (item.containsKey("routeName") && item.get("routeName") != null) {
                delivery.setRouteName(item.get("routeName").toString());
            }
            if (item.containsKey("routeStopOrder") && item.get("routeStopOrder") != null) {
                delivery.setRouteStopOrder(Integer.valueOf(item.get("routeStopOrder").toString()));
            }
            if (item.containsKey("vehicleNumber") && item.get("vehicleNumber") != null) {
                delivery.setVehicleNumber(item.get("vehicleNumber").toString());
            }

            updatedList.add(deliveryRepository.save(delivery));
        }
        return updatedList;
    }
}
