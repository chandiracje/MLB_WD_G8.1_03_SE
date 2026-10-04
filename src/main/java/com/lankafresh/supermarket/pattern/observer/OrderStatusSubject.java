package com.lankafresh.supermarket.pattern.observer;

import com.lankafresh.supermarket.entity.Order;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Concrete Subject: OrderStatusSubject.
 * 
 * Maintains a thread-safe list of registered observers and notifies them whenever
 * order lifecycle events occur (order placed, status updated, order cancelled).
 * 
 * Lecture Slide Reference:
 * - SE2030 Lecture 8: Design Patterns - Part I:
 *   Slides 36-39: "class TsunamiWarningSystem implements Subject {
 *                      private List<Observer> observers = new ArrayList<>();
 *                      public void addObserver(...) { ... }
 *                      public void notifyObservers() {
 *                          for (Observer observer : observers) { observer.update(message); }
 *                      }
 *                  }"
 */
@Component
public class OrderStatusSubject implements OrderSubject {

    // Thread-safe copy-on-write list allowing safe concurrent iteration and modifications
    private final List<OrderObserver> observers = new CopyOnWriteArrayList<>();

    @Override
    public void addObserver(OrderObserver observer) {
        if (observer != null && !observers.contains(observer)) {
            observers.add(observer);
        }
    }

    @Override
    public void removeObserver(OrderObserver observer) {
        if (observer != null) {
            observers.remove(observer);
        }
    }

    @Override
    public void notifyObservers(Order order, String eventType, String message) {
        for (OrderObserver observer : observers) {
            try {
                observer.update(order, eventType, message);
            } catch (Exception e) {
                // Safeguard against observer exceptions crashing the notification loop
                System.err.printf("[OBSERVER ERROR] Failed notifying %s: %s%n",
                        observer.getObserverName(), e.getMessage());
            }
        }
    }

    public List<OrderObserver> getRegisteredObservers() {
        return Collections.unmodifiableList(observers);
    }
}
