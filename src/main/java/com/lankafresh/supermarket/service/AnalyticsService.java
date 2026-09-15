package com.lankafresh.supermarket.service;

import com.lankafresh.supermarket.entity.OrderStatus;
import com.lankafresh.supermarket.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final DeliveryRepository deliveryRepository;
    private final SupportTicketRepository supportTicketRepository;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        stats.put("totalOrders", orderRepository.count());
        stats.put("totalProducts", productRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("lowStockCount", productRepository.findLowStockProducts().size());
        stats.put("totalDeliveries", deliveryRepository.count());
        stats.put("totalTickets", supportTicketRepository.count());

        return stats;
    }
}
