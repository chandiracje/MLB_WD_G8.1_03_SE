package com.lankafresh.supermarket.pattern.observer;

import com.lankafresh.supermarket.entity.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Concrete Observer: Customer Notification Observer.
 * 
 * Simulates mobile app push notifications, SMS alerts, and email notifications
 * delivered to the customer upon order state transitions.
 * 
 * Lecture Slide Reference:
 * - SE2030 Lecture 8: Design Patterns - Part I:
 *   Slide 40: "public class MobileApp implements Observer {
 *                  public void update(...) { display(); }
 *                  private void display() { System.out.println("Mobile App: Message updated - " + message); }
 *              }"
 */
@Component
public class CustomerNotificationObserver implements OrderObserver {

    // In-memory log of recent notifications for verification and tracking
    private final List<String> notificationLog = new CopyOnWriteArrayList<>();

    @Override
    public void update(Order order, String eventType, String message) {
        String customerRecipient = (order != null && order.getUser() != null)
                ? order.getUser().getEmail()
                : "Customer";

        String tracking = (order != null) ? order.getTrackingNumber() : "N/A";
        String notification = String.format("[CUSTOMER NOTIFICATION] To %s | Order [%s] %s: %s",
                customerRecipient, tracking, eventType, message);

        notificationLog.add(notification);
        System.out.println(notification);
    }

    @Override
    public String getObserverName() {
        return "CustomerNotificationObserver (Mobile & SMS Channel)";
    }

    public List<String> getNotificationLog() {
        return Collections.unmodifiableList(notificationLog);
    }

    public void clearLog() {
        notificationLog.clear();
    }
}
