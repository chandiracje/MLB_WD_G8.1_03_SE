package com.lankafresh.supermarket.controller;

import com.lankafresh.supermarket.dto.OrderRequest;
import com.lankafresh.supermarket.entity.Order;
import com.lankafresh.supermarket.entity.OrderItem;
import com.lankafresh.supermarket.entity.OrderStatus;
import com.lankafresh.supermarket.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout/{userId}")
    public ResponseEntity<?> checkout(@PathVariable Long userId, @RequestBody OrderRequest request) {
        try {
            Order order = orderService.placeOrder(userId, request);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/checkout/guest")
    public ResponseEntity<?> checkoutGuest(@RequestBody OrderRequest request) {
        try {
            Order order = orderService.placeGuestOrder(request);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkoutGeneric(@RequestBody OrderRequest request) {
        try {
            Order order = orderService.placeGuestOrder(request);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUser(userId));
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(orderService.getOrderById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<?> getOrderByTrackingNumber(@PathVariable String trackingNumber) {
        try {
            return ResponseEntity.ok(orderService.getOrderByTrackingNumber(trackingNumber));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<List<OrderItem>> getOrderItems(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderItems(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        try {
            Order updated = orderService.updateOrderStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            Order cancelledOrder = orderService.cancelOrder(id);
            return ResponseEntity.ok(Map.of(
                "message", "Order cancelled successfully",
                "order", cancelledOrder
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        try {
            orderService.deleteOrder(id);
            return ResponseEntity.ok(Map.of(
                "message", "Order deleted successfully",
                "orderId", id
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

