package com.lankafresh.supermarket.pattern.observer;

import com.lankafresh.supermarket.entity.Order;

/**
 * Observer Interface defining the update contract.
 * 
 * Lecture Slide Reference:
 * - SE2030 Lecture 8: Design Patterns - Part I:
 *   Slide 32: "Observer: Defines an interface with an update() method to ensure all observers receive updates consistently."
 *   Slide 35: "Implementation - Observer Class: public interface Observer { void update(String message); }"
 *   Slide 37: "interface Observer { void update(String message); }"
 */
public interface OrderObserver {

    /**
     * Called when the Subject's state changes.
     * 
     * @param order The order entity whose state changed.
     * @param eventType Event category (e.g. ORDER_PLACED, STATUS_CHANGED, ORDER_CANCELLED).
     * @param message Human-readable status notification message.
     */
    void update(Order order, String eventType, String message);

    /**
     * Unique identifier for this observer implementation.
     */
    String getObserverName();
}
