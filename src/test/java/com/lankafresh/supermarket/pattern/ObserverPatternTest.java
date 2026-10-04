package com.lankafresh.supermarket.pattern;

import com.lankafresh.supermarket.entity.Order;
import com.lankafresh.supermarket.entity.OrderStatus;
import com.lankafresh.supermarket.entity.User;
import com.lankafresh.supermarket.pattern.observer.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Tests for Observer Design Pattern.
 * 
 * Lecture Slide Reference:
 * - SE2030 Lecture 8: Design Patterns - Part I (Slides 28-42)
 *   Slide 34: Subject interface: addObserver, removeObserver, notifyObservers
 *   Slide 35: Observer interface: update(message)
 *   Slide 38-39: ConcreteSubject: maintains list of observers, notifyObservers loops through
 *   Slide 40-41: ConcreteObservers: MobileApp, NewsChannel
 */
class ObserverPatternTest {

    private OrderStatusSubject subject;
    private CustomerNotificationObserver customerObserver;
    private InventoryAlertObserver inventoryObserver;
    private DeliveryDispatchObserver dispatchObserver;
    private FinanceLedgerObserver financeObserver;
    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        subject = new OrderStatusSubject();
        customerObserver = new CustomerNotificationObserver();
        inventoryObserver = new InventoryAlertObserver();
        dispatchObserver = new DeliveryDispatchObserver();
        financeObserver = new FinanceLedgerObserver();

        customerObserver.clearLog();
        inventoryObserver.clearLog();
        dispatchObserver.clearLog();
        financeObserver.clearLog();

        User user = User.builder()
                .id(1L)
                .name("Kasun Dias")
                .email("kasun@lankafresh.lk")
                .phone("0719876543")
                .address("15 Station Road, Dehiwala")
                .build();

        sampleOrder = Order.builder()
                .id(501L)
                .trackingNumber("LK-OBS-7788")
                .totalAmount(new BigDecimal("3500.00"))
                .status(OrderStatus.PLACED)
                .paymentMethod("CARD")
                .paymentStatus("PAID")
                .deliveryAddress(user.getAddress())
                .user(user)
                .build();
    }

    @Test
    @DisplayName("Verify Observer Registration and Deregistration (Slides 38-39)")
    void testObserverRegistration() {
        assertEquals(0, subject.getRegisteredObservers().size());

        subject.addObserver(customerObserver);
        subject.addObserver(inventoryObserver);
        assertEquals(2, subject.getRegisteredObservers().size());

        // Deduplication check
        subject.addObserver(customerObserver);
        assertEquals(2, subject.getRegisteredObservers().size());

        subject.removeObserver(inventoryObserver);
        assertEquals(1, subject.getRegisteredObservers().size());
        assertTrue(subject.getRegisteredObservers().contains(customerObserver));
    }

    @Test
    @DisplayName("Verify Subject broadcasts state update to all registered observers (Slides 38-41)")
    void testNotifyAllObservers() {
        subject.addObserver(customerObserver);
        subject.addObserver(inventoryObserver);
        subject.addObserver(dispatchObserver);
        subject.addObserver(financeObserver);

        subject.notifyObservers(sampleOrder, "ORDER_PLACED", "Customer order checkout completed.");

        // Assert customer observer received message
        assertEquals(1, customerObserver.getNotificationLog().size());
        assertTrue(customerObserver.getNotificationLog().get(0).contains("kasun@lankafresh.lk"));
        assertTrue(customerObserver.getNotificationLog().get(0).contains("LK-OBS-7788"));

        // Assert inventory observer logged stock event
        assertEquals(1, inventoryObserver.getInventoryAlertLog().size());
        assertTrue(inventoryObserver.getInventoryAlertLog().get(0).contains("Stock allocation committed"));

        // Assert delivery dispatch observer queued order
        assertEquals(1, dispatchObserver.getDispatchLog().size());
        assertTrue(dispatchObserver.getDispatchLog().get(0).contains("Dehiwala"));

        // Assert finance ledger recorded credit
        assertEquals(1, financeObserver.getFinanceAuditLog().size());
        assertTrue(financeObserver.getFinanceAuditLog().get(0).contains("Credit booked: Rs. 3500.00"));
    }

    @Test
    @DisplayName("Verify Order Cancellation triggers restock and refund accounting across observers")
    void testOrderCancellationNotification() {
        subject.addObserver(inventoryObserver);
        subject.addObserver(financeObserver);

        sampleOrder.setStatus(OrderStatus.CANCELLED);
        subject.notifyObservers(sampleOrder, "ORDER_CANCELLED", "Order cancelled by customer.");

        // Assert inventory restored
        assertEquals(1, inventoryObserver.getInventoryAlertLog().size());
        assertTrue(inventoryObserver.getInventoryAlertLog().get(0).contains("Items restored to warehouse inventory stock"));

        // Assert finance reversing debit entry
        assertEquals(1, financeObserver.getFinanceAuditLog().size());
        assertTrue(financeObserver.getFinanceAuditLog().get(0).contains("Debit reversal: Rs. 3500.00"));
    }
}
