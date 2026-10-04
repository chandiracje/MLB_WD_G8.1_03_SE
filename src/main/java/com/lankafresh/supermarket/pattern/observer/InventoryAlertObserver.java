package com.lankafresh.supermarket.pattern.observer;

import com.lankafresh.supermarket.entity.Order;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Concrete Observer: Inventory Alert Observer.
 * 
 * Monitors order lifecycle events to alert warehouse managers of stock depletion,
 * trigger low-stock quarantine, or flag restock events when orders are cancelled.
 * 
 * Lecture Slide Reference:
 * - SE2030 Lecture 8: Design Patterns - Part I:
 *   Slide 41: "public class NewsChannel implements Observer { ... }"
 */
@Component
public class InventoryAlertObserver implements OrderObserver {

    private final List<String> inventoryAlertLog = new CopyOnWriteArrayList<>();

    @Override
    public void update(Order order, String eventType, String message) {
        String logEntry;
        if ("ORDER_PLACED".equalsIgnoreCase(eventType)) {
            logEntry = String.format("[INVENTORY MONITOR] Stock allocation committed for Order #%d (%s). Checking reorder levels.",
                    order != null ? order.getId() : 0,
                    order != null ? order.getTrackingNumber() : "N/A");
        } else if ("ORDER_CANCELLED".equalsIgnoreCase(eventType) || "CANCELLED".equalsIgnoreCase(eventType)) {
            logEntry = String.format("[INVENTORY RESTORE] Order #%d (%s) cancelled. Items restored to warehouse inventory stock.",
                    order != null ? order.getId() : 0,
                    order != null ? order.getTrackingNumber() : "N/A");
        } else {
            logEntry = String.format("[INVENTORY STATUS] Event [%s] logged for Order #%d: %s",
                    eventType, order != null ? order.getId() : 0, message);
        }

        inventoryAlertLog.add(logEntry);
        System.out.println(logEntry);
    }

    @Override
    public String getObserverName() {
        return "InventoryAlertObserver (Warehouse & Stock Controller)";
    }

    public List<String> getInventoryAlertLog() {
        return Collections.unmodifiableList(inventoryAlertLog);
    }

    public void clearLog() {
        inventoryAlertLog.clear();
    }
}
