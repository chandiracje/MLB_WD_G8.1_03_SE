package com.lankafresh.supermarket.controller;

import com.lankafresh.supermarket.entity.Delivery;
import com.lankafresh.supermarket.entity.DeliveryStatus;
import com.lankafresh.supermarket.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DeliveryController {

    private final DeliveryService deliveryService;

    @GetMapping
    public ResponseEntity<List<Delivery>> getAllDeliveries() {
        return ResponseEntity.ok(deliveryService.getAllDeliveries());
    }

    @GetMapping("/staff/{staffId}")
    public ResponseEntity<List<Delivery>> getDeliveriesByStaff(@PathVariable Long staffId) {
        return ResponseEntity.ok(deliveryService.getDeliveriesByStaff(staffId));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignStaff(
            @PathVariable Long id,
            @RequestParam Long staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime estimatedTime) {
        try {
            Delivery updated = deliveryService.assignStaff(id, staffId, estimatedTime != null ? estimatedTime : LocalDateTime.now().plusHours(2));
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam DeliveryStatus status,
            @RequestParam(required = false) String notes) {
        try {
            Delivery updated = deliveryService.updateStatus(id, status, notes);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
