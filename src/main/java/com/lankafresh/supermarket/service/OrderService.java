package com.lankafresh.supermarket.service;

import com.lankafresh.supermarket.dto.CartItemRequest;
import com.lankafresh.supermarket.dto.OrderRequest;
import com.lankafresh.supermarket.entity.*;
import com.lankafresh.supermarket.repository.*;
import com.lankafresh.supermarket.pattern.decorator.*;
import com.lankafresh.supermarket.pattern.factory.DeliveryVehicle;
import com.lankafresh.supermarket.pattern.factory.DeliveryVehicleFactory;
import com.lankafresh.supermarket.pattern.factory.PaymentStrategyFactory;
import com.lankafresh.supermarket.pattern.observer.*;
import com.lankafresh.supermarket.pattern.singleton.SupermarketSystemConfig;
import com.lankafresh.supermarket.pattern.strategy.PaymentContext;
import com.lankafresh.supermarket.pattern.strategy.PaymentResult;
import com.lankafresh.supermarket.pattern.strategy.PaymentStrategy;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final CartRepository cartRepository;
    private final DeliveryRepository deliveryRepository;
    private final PasswordEncoder passwordEncoder;

    // Behavioral: Observer Pattern dependencies
    private final OrderStatusSubject orderStatusSubject;
    private final CustomerNotificationObserver customerNotificationObserver;
    private final InventoryAlertObserver inventoryAlertObserver;
    private final DeliveryDispatchObserver deliveryDispatchObserver;
    private final FinanceLedgerObserver financeLedgerObserver;

    @PostConstruct
    public void registerObservers() {
        // Register Concrete Observers with the Subject upon service startup (Slides 36-39)
        orderStatusSubject.addObserver(customerNotificationObserver);
        orderStatusSubject.addObserver(inventoryAlertObserver);
        orderStatusSubject.addObserver(deliveryDispatchObserver);
        orderStatusSubject.addObserver(financeLedgerObserver);
    }

    @Transactional
    public Order placeGuestOrder(OrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Checkout cart is empty.");
        }
        String guestEmail = (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank())
                ? request.getCustomerEmail().trim().toLowerCase()
                : "guest_" + UUID.randomUUID().toString().substring(0, 8) + "@lankafresh.lk";

        String guestName = (request.getCustomerName() != null && !request.getCustomerName().isBlank())
                ? request.getCustomerName().trim()
                : "Valued Guest Customer";

        String guestPhone = request.getCustomerPhone() != null ? request.getCustomerPhone().trim() : "";

        User user = userRepository.findByEmail(guestEmail).orElseGet(() -> {
            User newUser = User.builder()
                    .name(guestName)
                    .email(guestEmail)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(UserRole.CUSTOMER)
                    .phone(guestPhone)
                    .address(request.getDeliveryAddress())
                    .build();
            return userRepository.save(newUser);
        });

        // Update phone or address if not previously stored
        boolean updated = false;
        if ((user.getPhone() == null || user.getPhone().isBlank()) && !guestPhone.isBlank()) {
            user.setPhone(guestPhone);
            updated = true;
        }
        if ((user.getAddress() == null || user.getAddress().isBlank()) && request.getDeliveryAddress() != null && !request.getDeliveryAddress().isBlank()) {
            user.setAddress(request.getDeliveryAddress());
            updated = true;
        }
        if (updated) {
            userRepository.save(user);
        }

        return placeOrder(user.getId(), request);
    }

    @Transactional
    public Order placeOrder(Long userId, OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));

        List<CartItemRequest> directItems = request.getItems();
        BigDecimal rawSubtotal = BigDecimal.ZERO;
        int totalQuantity = 0;

        if (directItems != null && !directItems.isEmpty()) {
            // Validate direct items from checkout request
            for (CartItemRequest cir : directItems) {
                Product product = productRepository.findById(cir.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found with id: " + cir.getProductId()));
                if (product.getStockQuantity() < cir.getQuantity()) {
                    throw new RuntimeException("Item '" + product.getName() + "' exceeds available stock (" + product.getStockQuantity() + " remaining).");
                }
                BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(cir.getQuantity()));
                rawSubtotal = rawSubtotal.add(itemTotal);
                totalQuantity += cir.getQuantity();
            }
        } else {
            // Read from DB cart
            List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
            if (cartItems.isEmpty()) {
                throw new RuntimeException("Cart is empty. Please select products to order.");
            }
            for (CartItem item : cartItems) {
                Product product = item.getProduct();
                if (product.getStockQuantity() < item.getQuantity()) {
                    throw new RuntimeException("Item '" + product.getName() + "' exceeds available stock (" + product.getStockQuantity() + " remaining).");
                }
                BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                rawSubtotal = rawSubtotal.add(itemTotal);
                totalQuantity += item.getQuantity();
            }
        }

        // =========================================================================
        // 1. Structural: Decorator Design Pattern (Slides 37-49)
        // Dynamically wrap base order cost with optional value-added services
        // =========================================================================
        OrderPricingComponent pricing = new BaseOrderCost(rawSubtotal);

        if (Boolean.TRUE.equals(request.getGiftWrap())) {
            pricing = new GiftWrappingDecorator(pricing);
        }
        if (Boolean.TRUE.equals(request.getColdChain())) {
            pricing = new ColdChainPackagingDecorator(pricing);
        }
        if (Boolean.TRUE.equals(request.getEcoBag())) {
            pricing = new EcoFriendlyBagDecorator(pricing);
        }

        boolean isExpress = request.getDeliverySlot() != null &&
                request.getDeliverySlot().toLowerCase().contains("express");
        if (isExpress) {
            pricing = new ExpressDeliveryDecorator(pricing);
        }

        BigDecimal totalAmount = pricing.getCost();
        String pricingDescription = pricing.getDescription();

        // =========================================================================
        // 2. Behavioral: Strategy Pattern & Creational: Factory Pattern (Slides 10-36)
        // Factory instantiates interchangeable PaymentStrategy algorithm
        // =========================================================================
        String trackingNumber = "LK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        PaymentStrategy paymentStrategy = PaymentStrategyFactory.getPaymentStrategy(request.getPaymentMethod());

        PaymentContext paymentContext = PaymentContext.builder()
                .orderTrackingNumber(trackingNumber)
                .customerName(user.getName())
                .customerEmail(user.getEmail())
                .customerPhone(user.getPhone())
                .deliveryAddress(request.getDeliveryAddress() != null && !request.getDeliveryAddress().isBlank()
                        ? request.getDeliveryAddress() : user.getAddress())
                .cardNumber(request.getCardNumber())
                .cardExpiry(request.getCardExpiry())
                .cardCvv(request.getCardCvv())
                .paypalEmail(request.getPaypalEmail())
                .bankReference(request.getBankReference())
                .walletProvider(request.getWalletProvider())
                .build();

        PaymentResult paymentResult = paymentStrategy.pay(totalAmount, paymentContext);

        // Create Order
        Order order = Order.builder()
                .user(user)
                .totalAmount(totalAmount)
                .status(OrderStatus.PLACED)
                .deliveryAddress(request.getDeliveryAddress() != null && !request.getDeliveryAddress().isBlank() ? request.getDeliveryAddress() : user.getAddress())
                .deliverySlot(request.getDeliverySlot() != null && !request.getDeliverySlot().isBlank() ? request.getDeliverySlot() : "Express Delivery (Within 60 Mins)")
                .trackingNumber(trackingNumber)
                .paymentMethod(paymentStrategy.getMethodName())
                .paymentStatus(paymentResult.getPaymentStatus())
                .build();

        order = orderRepository.save(order);

        // Deduct stock and create OrderItems
        if (directItems != null && !directItems.isEmpty()) {
            for (CartItemRequest cir : directItems) {
                Product product = productRepository.findById(cir.getProductId()).get();
                product.setStockQuantity(Math.max(0, product.getStockQuantity() - cir.getQuantity()));
                productRepository.save(product);

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .quantity(cir.getQuantity())
                        .price(product.getPrice())
                        .build();
                orderItemRepository.save(orderItem);
            }
        } else {
            List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
            for (CartItem item : cartItems) {
                Product product = item.getProduct();
                product.setStockQuantity(Math.max(0, product.getStockQuantity() - item.getQuantity()));
                productRepository.save(product);

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .quantity(item.getQuantity())
                        .price(product.getPrice())
                        .build();
                orderItemRepository.save(orderItem);
            }
        }

        // Clear customer cart in database if any
        cartItemRepository.deleteByCartId(cart.getId());

        // =========================================================================
        // 3. Creational: Factory Pattern for Delivery Vehicle Allocation (Slides 29-34)
        // Selects optimal vehicle (Bike, Van, Refrigerated Truck) based on order load
        // =========================================================================
        boolean requiresColdChain = Boolean.TRUE.equals(request.getColdChain());
        DeliveryVehicle vehicle = DeliveryVehicleFactory.selectVehicleForOrder(totalQuantity, isExpress, requiresColdChain);
        String vehicleDispatchNote = vehicle.dispatch(order.getId(), order.getTrackingNumber(), order.getDeliveryAddress());

        // Create Delivery Record
        LocalDateTime estimatedTime = null;
        if (request.getScheduledTime() != null && !request.getScheduledTime().isBlank()) {
            try {
                estimatedTime = LocalDateTime.parse(request.getScheduledTime());
            } catch (Exception ignored) {}
        }
        if (estimatedTime == null) {
            estimatedTime = LocalDateTime.now().plusHours(2);
        }

        String finalRouteName = (request.getDeliveryRoute() != null && !request.getDeliveryRoute().isBlank())
                ? request.getDeliveryRoute().trim()
                : resolveRouteFromAddress(order.getDeliveryAddress());

        Delivery delivery = Delivery.builder()
                .order(order)
                .status(DeliveryStatus.PENDING)
                .routeName(finalRouteName)
                .estimatedTime(estimatedTime)
                .notes(vehicleDispatchNote)
                .build();
        deliveryRepository.save(delivery);

        // =========================================================================
        // 4. Behavioral: Observer Pattern (Part I Slides 28-42)
        // ConcreteSubject broadcasts state changes to registered observers
        // =========================================================================
        orderStatusSubject.notifyObservers(order, "ORDER_PLACED",
                String.format("Order placed. Pricing: [%s] | Payment: %s (%s) | %s",
                        pricingDescription, paymentStrategy.getMethodName(), paymentResult.getPaymentStatus(), vehicleDispatchNote));

        return order;
    }

    public Order getOrderByTrackingNumber(String trackingNumber) {
        return orderRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new RuntimeException("Order not found with tracking number: " + trackingNumber));
    }

    public List<Order> getOrdersByUser(Long userId) {
        return orderRepository.findByUserIdOrderByOrderDateDesc(userId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    public List<OrderItem> getOrderItems(Long orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = getOrderById(orderId);
        order.setStatus(status);

        // If order was cancelled or refunded, restore stock
        if (status == OrderStatus.CANCELLED || status == OrderStatus.REFUNDED) {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            for (OrderItem item : items) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }

            deliveryRepository.findByOrderId(orderId).ifPresent(delivery -> {
                delivery.setStatus(DeliveryStatus.FAILED);
                delivery.setNotes("Order status changed to " + status);
                deliveryRepository.save(delivery);
            });
        }

        order = orderRepository.save(order);

        // Behavioral: Observer Pattern notification
        orderStatusSubject.notifyObservers(order, "STATUS_UPDATED",
                "Order #" + order.getId() + " (" + order.getTrackingNumber() + ") status transitioned to: " + status);

        return order;
    }

    @Transactional
    public Order cancelOrder(Long orderId) {
        Order order = getOrderById(orderId);

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new RuntimeException("Completed (Delivered) orders cannot be cancelled.");
        }

        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REFUNDED) {
            throw new RuntimeException("Order is already cancelled.");
        }

        // Restore product inventory
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        // Update delivery if exists
        deliveryRepository.findByOrderId(orderId).ifPresent(delivery -> {
            delivery.setStatus(DeliveryStatus.FAILED);
            delivery.setNotes("Cancelled by customer request");
            deliveryRepository.save(delivery);
        });

        order.setStatus(OrderStatus.CANCELLED);
        order = orderRepository.save(order);

        // Behavioral: Observer Pattern notification
        orderStatusSubject.notifyObservers(order, "ORDER_CANCELLED",
                "Order #" + order.getId() + " (" + order.getTrackingNumber() + ") cancelled by customer. Stock restored to inventory.");

        return order;
    }

    public OrderStatusSubject getOrderStatusSubject() {
        return orderStatusSubject;
    }

    @Transactional
    public void deleteOrder(Long orderId) {
        Order order = getOrderById(orderId);

        if (order.getStatus() != OrderStatus.DELIVERED &&
            order.getStatus() != OrderStatus.CANCELLED &&
            order.getStatus() != OrderStatus.REFUNDED) {
            throw new RuntimeException("Only finished (Delivered) or cancelled orders can be deleted. Please cancel active orders first.");
        }

        // Remove associated delivery record first to maintain relational integrity
        deliveryRepository.findByOrderId(orderId).ifPresent(deliveryRepository::delete);

        // Remove associated order items
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        if (!items.isEmpty()) {
            orderItemRepository.deleteAll(items);
        }

        // Delete the order itself
        orderRepository.delete(order);
    }

    private String resolveRouteFromAddress(String address) {
        if (address == null || address.isBlank()) {
            return "Route 1 - Colombo Central Express";
        }
        String lower = address.toLowerCase();

        if (lower.contains("bambalapitiya") || lower.contains("wellawatte") || lower.contains("dehiwala")
                || lower.contains("mount lavinia") || lower.contains("ratmalana") || lower.contains("moratuwa")
                || lower.contains("colombo 4") || lower.contains("colombo 04") || lower.contains("colombo 5")
                || lower.contains("colombo 05") || lower.contains("colombo 6") || lower.contains("colombo 06")
                || lower.contains("col 4") || lower.contains("col 04") || lower.contains("col 5")
                || lower.contains("col 05") || lower.contains("col 6") || lower.contains("col 06")) {
            return "Route 2 - Colombo South Coastal Corridor";
        }

        if (lower.contains("cinnamon") || lower.contains("borella") || lower.contains("rajagiriya")
                || lower.contains("battaramulla") || lower.contains("pelawatte") || lower.contains("kotte")
                || lower.contains("nawala") || lower.contains("colombo 7") || lower.contains("colombo 07")
                || lower.contains("colombo 8") || lower.contains("colombo 08") || lower.contains("col 7")
                || lower.contains("col 07") || lower.contains("col 8") || lower.contains("col 08")) {
            return "Route 3 - Colombo East Metro Hub";
        }

        if (lower.contains("maradana") || lower.contains("grandpass") || lower.contains("peliyagoda")
                || lower.contains("kelaniya") || lower.contains("wattala") || lower.contains("ja-ela")
                || lower.contains("ja ela") || lower.contains("kandana") || lower.contains("kiribathgoda")
                || lower.contains("colombo 10") || lower.contains("colombo 11") || lower.contains("colombo 12")
                || lower.contains("colombo 13") || lower.contains("colombo 14") || lower.contains("colombo 15")) {
            return "Route 4 - Colombo North Industrial Metro";
        }

        if (lower.contains("nugegoda") || lower.contains("kohuwala") || lower.contains("maharagama")
                || lower.contains("kottawa") || lower.contains("pannipitiya") || lower.contains("homagama")
                || lower.contains("piliyandala") || lower.contains("boralesgamuwa") || lower.contains("thalawathugoda")) {
            return "Route 5 - Greater Colombo Outer Ring";
        }

        if (lower.contains("malabe") || lower.contains("koswatte") || lower.contains("thalahena")
                || lower.contains("kaduwela") || lower.contains("athurugiriya") || lower.contains("hokandara")) {
            return "Route 6 - Tech & Suburban Hub";
        }

        return "Route 1 - Colombo Central Express";
    }
}

