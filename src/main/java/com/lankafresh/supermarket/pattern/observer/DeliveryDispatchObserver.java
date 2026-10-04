package com.lankafresh.supermarket.pattern.observer;

import com.lankafresh.supermarket.entity.Order;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Concrete Observer: Delivery Dispatch Observer.
 * 
 * Prepares logistics corridor routing, alerts drivers when orders are packed,
 * and tracks real-time fulfillment status.
 */
@Component
public class DeliveryDispatchObserver implements OrderObserver {

    private final List<String> dispatchLog = new CopyOnWriteArrayList<>();

    @Override
    public void update(Order order, String eventType, String message) {
        String logEntry = String.format("[LOGISTICS DISPATCH] Dispatch queue updated for Order #%d [%s] | Event: %s | Destination: %s",
                order != null ? order.getId() : 0,
                order != null ? order.getTrackingNumber() : "N/A",
                eventType,
                order != null ? order.getDeliveryAddress() : "Colombo");

        dispatchLog.add(logEntry);
        System.out.println(logEntry);
    }

    @Override
    public String getObserverName() {
        return "DeliveryDispatchObserver (Logistics Dispatch Corridor)";
    }

    public List<String> getDispatchLog() {
        return Collections.unmodifiableList(dispatchLog);
    }

    public void clearLog() {
        dispatchLog.clear();
    }
}
