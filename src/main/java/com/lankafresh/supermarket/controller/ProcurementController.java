package com.lankafresh.supermarket.controller;

import com.lankafresh.supermarket.entity.PurchaseOrder;
import com.lankafresh.supermarket.entity.PurchaseOrderStatus;
import com.lankafresh.supermarket.entity.Supplier;
import com.lankafresh.supermarket.service.ProcurementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/procurement")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProcurementController {

    private final ProcurementService procurementService;

    @GetMapping("/suppliers")
    public ResponseEntity<List<Supplier>> getSuppliers() {
        return ResponseEntity.ok(procurementService.getAllSuppliers());
    }

    @GetMapping("/suppliers/{id}")
    public ResponseEntity<?> getSupplierById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(procurementService.getSupplierById(id));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/suppliers")
    public ResponseEntity<Supplier> createSupplier(@RequestBody Supplier supplier) {
        return ResponseEntity.ok(procurementService.createSupplier(supplier));
    }

    @PutMapping("/suppliers/{id}")
    public ResponseEntity<?> updateSupplier(@PathVariable Long id, @RequestBody Supplier supplier) {
        try {
            return ResponseEntity.ok(procurementService.updateSupplier(id, supplier));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/suppliers/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {
        try {
            procurementService.deleteSupplier(id);
            return ResponseEntity.ok(Map.of("message", "Supplier deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<List<PurchaseOrder>> getPurchaseOrders() {
        return ResponseEntity.ok(procurementService.getAllPurchaseOrders());
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createPurchaseOrder(
            @RequestParam Long supplierId,
            @RequestParam Long userId,
            @RequestParam BigDecimal totalCost) {
        try {
            PurchaseOrder po = procurementService.createPurchaseOrder(supplierId, userId, totalCost);
            return ResponseEntity.ok(po);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updatePoStatus(@PathVariable Long id, @RequestParam PurchaseOrderStatus status) {
        try {
            PurchaseOrder updated = procurementService.updatePoStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
