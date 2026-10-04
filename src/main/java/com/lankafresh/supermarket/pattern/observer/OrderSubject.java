package com.lankafresh.supermarket.pattern.observer;

import com.lankafresh.supermarket.entity.Order;

/**
 * Subject Interface defining registration and notification methods.
 * 
 * Lecture Slide Reference:
 * - SE2030 Lecture 8: Design Patterns - Part I:
 *   Slide 32: "Subject: Maintains a list of observers, provides methods to add/remove them,
 *              and notifies them of state changes."
 *   Slide 34: "public interface Subject {
 *                  void addObserver(Observer observer);
 *                  void removeObserver(Observer observer);
 *                  void notifyObservers();
 *              }"
 */
public interface OrderSubject {

    /**
     * Registers a new observer to receive state change broadcasts.
     */
    void addObserver(OrderObserver observer);

    /**
     * Deregisters an observer.
     */
    void removeObserver(OrderObserver observer);

    /**
     * Broadcasts state update to all registered observers.
     */
    void notifyObservers(Order order, String eventType, String message);
}
