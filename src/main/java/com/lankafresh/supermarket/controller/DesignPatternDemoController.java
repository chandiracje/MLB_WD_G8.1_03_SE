package com.lankafresh.supermarket.controller;

import com.lankafresh.supermarket.entity.Order;
import com.lankafresh.supermarket.entity.OrderStatus;
import com.lankafresh.supermarket.entity.User;
import com.lankafresh.supermarket.pattern.decorator.*;
import com.lankafresh.supermarket.pattern.factory.DeliveryVehicle;
import com.lankafresh.supermarket.pattern.factory.DeliveryVehicleFactory;
import com.lankafresh.supermarket.pattern.factory.PaymentStrategyFactory;
import com.lankafresh.supermarket.pattern.observer.*;
import com.lankafresh.supermarket.pattern.singleton.SupermarketSystemConfig;
import com.lankafresh.supermarket.pattern.strategy.PaymentContext;
import com.lankafresh.supermarket.pattern.strategy.PaymentResult;
import com.lankafresh.supermarket.pattern.strategy.PaymentStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Controller exposing interactive endpoints to demonstrate and verify all 5 Design Patterns
 * taught in SE2030 Software Engineering (Part I & Part II).
 */
@RestController
@RequestMapping("/api/patterns")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DesignPatternDemoController {

    private final OrderStatusSubject orderStatusSubject;
    private final CustomerNotificationObserver customerNotificationObserver;
    private final InventoryAlertObserver inventoryAlertObserver;
    private final DeliveryDispatchObserver deliveryDispatchObserver;
    private final FinanceLedgerObserver financeLedgerObserver;

    /**
     * Pattern Overview & Architecture Summary
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getPatternSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("module", "SE2030 Software Engineering");
        summary.put("institution", "Sri Lanka Institute of Information Technology (SLIIT)");
        summary.put("topic", "Gang of Four (GoF) Design Patterns Implementation in LankaFresh Supermarket");

        List<Map<String, Object>> patterns = new ArrayList<>();

        patterns.add(Map.of(
            "name", "Singleton Pattern",
            "type", "Creational",
            "lectureSlideRef", "Part I: Slides 14-27",
            "javaClass", "SupermarketSystemConfig",
            "purpose", "Guarantees a single global configuration instance across the JVM with thread-safe double-checked locking."
        ));

        patterns.add(Map.of(
            "name", "Strategy Pattern",
            "type", "Behavioral",
            "lectureSlideRef", "Part II: Slides 2-24 (Example 01: E-commerce Payment)",
            "javaInterface", "PaymentStrategy",
            "concreteClasses", List.of("CreditCardPaymentStrategy", "PayPalPaymentStrategy", "BankTransferPaymentStrategy", "CashOnDeliveryPaymentStrategy", "MobileWalletPaymentStrategy"),
            "purpose", "Defines family of interchangeable checkout payment algorithms without long if-else chains."
        ));

        patterns.add(Map.of(
            "name", "Factory Pattern",
            "type", "Creational",
            "lectureSlideRef", "Part II: Slides 25-36 (Vehicle Rental / Transport Management)",
            "factoryClasses", List.of("PaymentStrategyFactory", "DeliveryVehicleFactory"),
            "productInterface", "DeliveryVehicle",
            "concreteProducts", List.of("DeliveryMotorbike (BIKE)", "DeliveryVan (VAN/CAR)", "RefrigeratedTruck (TRUCK)"),
            "purpose", "Centralizes object creation details and decouples callers from concrete product classes."
        ));

        patterns.add(Map.of(
            "name", "Decorator Pattern",
            "type", "Structural",
            "lectureSlideRef", "Part II: Slides 37-49 (Online Ordering Add-ons)",
            "componentInterface", "OrderPricingComponent",
            "concreteComponent", "BaseOrderCost",
            "abstractDecorator", "OrderCostDecorator",
            "concreteDecorators", List.of("GiftWrappingDecorator (+Rs.150)", "ColdChainPackagingDecorator (+Rs.250)", "ExpressDeliveryDecorator (+Rs.350)", "EcoFriendlyBagDecorator (+Rs.75)"),
            "purpose", "Dynamically attaches value-added packaging and express delivery services without subclass explosion."
        ));

        patterns.add(Map.of(
            "name", "Observer Pattern",
            "type", "Behavioral",
            "lectureSlideRef", "Part I: Slides 28-42 (Subject, Observer, ConcreteSubject, ConcreteObserver)",
            "subjectInterface", "OrderSubject",
            "concreteSubject", "OrderStatusSubject",
            "observerInterface", "OrderObserver",
            "concreteObservers", List.of("CustomerNotificationObserver", "InventoryAlertObserver", "DeliveryDispatchObserver", "FinanceLedgerObserver"),
            "purpose", "Maintains one-to-many dependency notifying customer alerts, inventory stock, driver dispatch, and finance ledgers on state transitions."
        ));

        summary.put("implementedPatterns", patterns);
        return ResponseEntity.ok(summary);
    }

    // =========================================================================
    // 1. SINGLETON PATTERN ENDPOINTS
    // =========================================================================
    @GetMapping("/singleton")
    public ResponseEntity<?> getSingletonConfig() {
        SupermarketSystemConfig config = SupermarketSystemConfig.getInstance();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("pattern", "Singleton Pattern (Creational)");
        response.put("instanceHashCode", System.identityHashCode(config));
        response.put("storeName", config.getStoreName());
        response.put("currencyCode", config.getCurrencyCode());
        response.put("standardDeliveryFee", config.getStandardDeliveryFee());
        response.put("expressDeliveryFee", config.getExpressDeliveryFee());
        response.put("freeDeliveryThreshold", config.getFreeDeliveryThreshold());
        response.put("taxRatePercentage", config.getTaxRatePercentage());
        response.put("lowStockAlertThreshold", config.getLowStockAlertThreshold());
        response.put("operatingHours", config.getOperatingHours());
        response.put("supportHotline", config.getSupportHotline());
        response.put("contactEmail", config.getContactEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/singleton")
    public ResponseEntity<?> updateSingletonConfig(@RequestBody Map<String, Object> updates) {
        SupermarketSystemConfig config = SupermarketSystemConfig.getInstance();
        if (updates.containsKey("storeName")) config.setStoreName((String) updates.get("storeName"));
        if (updates.containsKey("currencyCode")) config.setCurrencyCode((String) updates.get("currencyCode"));
        if (updates.containsKey("lowStockAlertThreshold")) {
            config.setLowStockAlertThreshold(((Number) updates.get("lowStockAlertThreshold")).intValue());
        }
        if (updates.containsKey("standardDeliveryFee")) {
            config.setStandardDeliveryFee(new BigDecimal(updates.get("standardDeliveryFee").toString()));
        }
        if (updates.containsKey("expressDeliveryFee")) {
            config.setExpressDeliveryFee(new BigDecimal(updates.get("expressDeliveryFee").toString()));
        }

        return ResponseEntity.ok(Map.of(
            "message", "SupermarketSystemConfig singleton updated successfully across all JVM threads",
            "instanceHashCode", System.identityHashCode(config),
            "updatedConfig", config
        ));
    }

    // =========================================================================
    // 2. STRATEGY PATTERN ENDPOINTS
    // =========================================================================
    @PostMapping("/strategy/pay")
    public ResponseEntity<?> testPaymentStrategy(@RequestBody Map<String, Object> request) {
        String method = (String) request.getOrDefault("paymentMethod", "CARD");
        BigDecimal amount = new BigDecimal(request.getOrDefault("amount", "1500.00").toString());

        PaymentStrategy strategy = PaymentStrategyFactory.getPaymentStrategy(method);

        PaymentContext context = PaymentContext.builder()
                .orderTrackingNumber("LK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customerName((String) request.getOrDefault("customerName", "Kamal Perera"))
                .customerEmail((String) request.getOrDefault("customerEmail", "kamal@example.lk"))
                .customerPhone((String) request.getOrDefault("customerPhone", "0771234567"))
                .deliveryAddress((String) request.getOrDefault("deliveryAddress", "123 Galle Road, Colombo 03"))
                .cardNumber((String) request.getOrDefault("cardNumber", "4111222233334444"))
                .bankReference((String) request.getOrDefault("bankReference", "BOC-DEP-9944"))
                .walletProvider((String) request.getOrDefault("walletProvider", "FriMi"))
                .build();

        PaymentResult result = strategy.pay(amount, context);

        return ResponseEntity.ok(Map.of(
            "pattern", "Strategy Pattern (Behavioral) & Factory Pattern (Creational)",
            "resolvedStrategyClass", strategy.getClass().getSimpleName(),
            "paymentMethod", strategy.getMethodName(),
            "paymentResult", result
        ));
    }

    // =========================================================================
    // 3. FACTORY PATTERN ENDPOINTS
    // =========================================================================
    @GetMapping("/factory/vehicles")
    public ResponseEntity<?> testVehicleFactory(@RequestParam(required = false, defaultValue = "10") int itemCount,
                                                @RequestParam(required = false, defaultValue = "false") boolean isExpress,
                                                @RequestParam(required = false, defaultValue = "false") boolean requiresColdChain) {

        DeliveryVehicle selectedVehicle = DeliveryVehicleFactory.selectVehicleForOrder(itemCount, isExpress, requiresColdChain);
        String dispatchMessage = selectedVehicle.dispatch(999L, "LK-DEMO1234", "Colombo Metropolitan Area");

        DeliveryVehicle bike = DeliveryVehicleFactory.createVehicle("BIKE");
        DeliveryVehicle van = DeliveryVehicleFactory.createVehicle("VAN");
        DeliveryVehicle truck = DeliveryVehicleFactory.createVehicle("TRUCK");

        List<Map<String, Object>> fleet = List.of(
            Map.of("type", bike.getVehicleType(), "maxCapacityKg", bike.getMaxCapacityKg(), "coldChain", bike.isTemperatureControlled()),
            Map.of("type", van.getVehicleType(), "maxCapacityKg", van.getMaxCapacityKg(), "coldChain", van.isTemperatureControlled()),
            Map.of("type", truck.getVehicleType(), "maxCapacityKg", truck.getMaxCapacityKg(), "coldChain", truck.isTemperatureControlled())
        );

        return ResponseEntity.ok(Map.of(
            "pattern", "Factory Pattern (Creational - Slides 25-36)",
            "availableFleet", fleet,
            "smartSelectedVehicle", Map.of(
                "type", selectedVehicle.getVehicleType(),
                "maxCapacityKg", selectedVehicle.getMaxCapacityKg(),
                "isTemperatureControlled", selectedVehicle.isTemperatureControlled(),
                "dispatchSimulation", dispatchMessage
            )
        ));
    }

    // =========================================================================
    // 4. DECORATOR PATTERN ENDPOINTS
    // =========================================================================
    @PostMapping("/decorator/calculate")
    public ResponseEntity<?> testDecoratorCalculation(@RequestBody Map<String, Object> request) {
        BigDecimal baseCost = new BigDecimal(request.getOrDefault("baseCost", "2500.00").toString());
        boolean giftWrap = Boolean.TRUE.equals(request.get("giftWrap"));
        boolean coldChain = Boolean.TRUE.equals(request.get("coldChain"));
        boolean expressDelivery = Boolean.TRUE.equals(request.get("expressDelivery"));
        boolean ecoBag = Boolean.TRUE.equals(request.get("ecoBag"));

        List<String> decorationSteps = new ArrayList<>();
        OrderPricingComponent pricing = new BaseOrderCost(baseCost);
        decorationSteps.add("Base Grocery Cost: Rs. " + pricing.getCost().toPlainString());

        if (giftWrap) {
            pricing = new GiftWrappingDecorator(pricing);
            decorationSteps.add("+ GiftWrappingDecorator (Rs. 150.00) -> Subtotal: Rs. " + pricing.getCost().toPlainString());
        }
        if (coldChain) {
            pricing = new ColdChainPackagingDecorator(pricing);
            decorationSteps.add("+ ColdChainPackagingDecorator (Rs. 250.00) -> Subtotal: Rs. " + pricing.getCost().toPlainString());
        }
        if (ecoBag) {
            pricing = new EcoFriendlyBagDecorator(pricing);
            decorationSteps.add("+ EcoFriendlyBagDecorator (Rs. 75.00) -> Subtotal: Rs. " + pricing.getCost().toPlainString());
        }
        if (expressDelivery) {
            pricing = new ExpressDeliveryDecorator(pricing);
            decorationSteps.add("+ ExpressDeliveryDecorator (Rs. 350.00) -> Subtotal: Rs. " + pricing.getCost().toPlainString());
        }

        return ResponseEntity.ok(Map.of(
            "pattern", "Decorator Pattern (Structural - Slides 37-49)",
            "baseCost", baseCost,
            "finalCost", pricing.getCost(),
            "itemizedDescription", pricing.getDescription(),
            "decorationPipeline", decorationSteps
        ));
    }

    // =========================================================================
    // 5. OBSERVER PATTERN ENDPOINTS
    // =========================================================================
    @PostMapping("/observer/simulate-event")
    public ResponseEntity<?> simulateObserverEvent(@RequestBody Map<String, Object> request) {
        String eventType = (String) request.getOrDefault("eventType", "ORDER_PLACED");
        String message = (String) request.getOrDefault("message", "Simulated lifecycle trigger for LankaFresh Supermarket");

        User dummyUser = User.builder()
                .name("Nimal Jayawardena")
                .email("nimal@lankafresh.lk")
                .phone("0712345678")
                .address("45 Kandy Road, Kiribathgoda")
                .build();

        Order dummyOrder = Order.builder()
                .id(1001L)
                .trackingNumber("LK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .totalAmount(new BigDecimal("3450.00"))
                .status(OrderStatus.PLACED)
                .deliveryAddress(dummyUser.getAddress())
                .paymentMethod("CARD")
                .paymentStatus("PAID")
                .user(dummyUser)
                .build();

        orderStatusSubject.notifyObservers(dummyOrder, eventType, message);

        return ResponseEntity.ok(Map.of(
            "pattern", "Observer Pattern (Behavioral - Part I Slides 28-42)",
            "subject", orderStatusSubject.getClass().getSimpleName(),
            "registeredObserverCount", orderStatusSubject.getRegisteredObservers().size(),
            "dispatchedEvent", Map.of(
                "orderId", dummyOrder.getId(),
                "trackingNumber", dummyOrder.getTrackingNumber(),
                "eventType", eventType,
                "message", message
            ),
            "customerObserverLog", customerNotificationObserver.getNotificationLog(),
            "inventoryObserverLog", inventoryAlertObserver.getInventoryAlertLog(),
            "dispatchObserverLog", deliveryDispatchObserver.getDispatchLog(),
            "financeObserverLog", financeLedgerObserver.getFinanceAuditLog()
        ));
    }

    @GetMapping("/observer/logs")
    public ResponseEntity<?> getObserverLogs() {
        return ResponseEntity.ok(Map.of(
            "customerNotifications", customerNotificationObserver.getNotificationLog(),
            "inventoryAlerts", inventoryAlertObserver.getInventoryAlertLog(),
            "deliveryDispatches", deliveryDispatchObserver.getDispatchLog(),
            "financeAuditEntries", financeLedgerObserver.getFinanceAuditLog()
        ));
    }
}
