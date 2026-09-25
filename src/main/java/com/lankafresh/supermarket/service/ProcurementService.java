package com.lankafresh.supermarket.service;

import com.lankafresh.supermarket.entity.*;
import com.lankafresh.supermarket.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProcurementService {

    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));
    }

    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier updateSupplier(Long id, Supplier updated) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));

        if (updated.getName() != null && !updated.getName().isBlank()) {
            existing.setName(updated.getName().trim());
        }
        if (updated.getContactName() != null) {
            existing.setContactName(updated.getContactName().trim());
        }
        if (updated.getEmail() != null) {
            existing.setEmail(updated.getEmail().trim());
        }
        if (updated.getPhone() != null) {
            existing.setPhone(updated.getPhone().trim());
        }
        if (updated.getAddress() != null) {
            existing.setAddress(updated.getAddress().trim());
        }

        return supplierRepository.save(existing);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new RuntimeException("Supplier not found with id: " + id);
        }
        if (purchaseOrderRepository.existsBySupplierId(id)) {
            throw new RuntimeException("Cannot delete supplier: There are existing purchase orders associated with this supplier.");
        }
        supplierRepository.deleteById(id);
    }

    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public PurchaseOrder createPurchaseOrder(Long supplierId, Long userId, BigDecimal totalCost) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PurchaseOrder po = PurchaseOrder.builder()
                .supplier(supplier)
                .createdBy(user)
                .totalCost(totalCost)
                .status(PurchaseOrderStatus.CREATED)
                .build();

        return purchaseOrderRepository.save(po);
    }

    @Transactional
    public PurchaseOrder updatePoStatus(Long poId, PurchaseOrderStatus status) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new RuntimeException("Purchase Order not found"));
        po.setStatus(status);
        return purchaseOrderRepository.save(po);
    }
}
