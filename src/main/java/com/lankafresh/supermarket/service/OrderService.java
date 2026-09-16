package com.lankafresh.supermarket.service;

import com.lankafresh.supermarket.dto.CartItemRequest;
import com.lankafresh.supermarket.dto.OrderRequest;
import com.lankafresh.supermarket.entity.*;
import com.lankafresh.supermarket.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
        BigDecimal totalAmount = BigDecimal.ZERO;

        if (directItems != null && !directItems.isEmpty()) {
            // Validate direct items from checkout request
            for (CartItemRequest cir : directItems) {
                Product product = productRepository.findById(cir.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found with id: " + cir.getProductId()));
                if (product.getStockQuantity() < cir.getQuantity()) {
                    throw new RuntimeException("Item '" + product.getName() + "' exceeds available stock (" + product.getStockQuantity() + " remaining).");
                }
                BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(cir.getQuantity()));
                totalAmount = totalAmount.add(itemTotal);
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
                totalAmount = totalAmount.add(itemTotal);
            }
        }

        String method = (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) ? request.getPaymentMethod() : "CARD";
        String pStatus = (method.toUpperCase().contains("COD") || method.toUpperCase().contains("CASH")) ? "PENDING_COD" : "PAID";

        // Create Order
        Order order = Order.builder()
                .user(user)
                .totalAmount(totalAmount)
                .status(OrderStatus.PLACED)
                .deliveryAddress(request.getDeliveryAddress() != null && !request.getDeliveryAddress().isBlank() ? request.getDeliveryAddress() : user.getAddress())
                .deliverySlot(request.getDeliverySlot() != null && !request.getDeliverySlot().isBlank() ? request.getDeliverySlot() : "Express Delivery (Within 60 Mins)")
                .trackingNumber("LK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .paymentMethod(method)
                .paymentStatus(pStatus)
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

        // Create Delivery Record
        Delivery delivery = Delivery.builder()
                .order(order)
                .status(DeliveryStatus.PENDING)
                .notes("Order awaiting dispatch assignment")
                .build();
        deliveryRepository.save(delivery);

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

        return orderRepository.save(order);
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
        return orderRepository.save(order);
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
}

