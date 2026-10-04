package com.lankafresh.supermarket.pattern.decorator;

import java.math.BigDecimal;

/**
 * Component Interface for Order Pricing and Cost Calculation.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02:
 *   Slide 39: Class Diagram of Decorator Design Pattern (Component with Operation())
 *   Slide 43: Component & Concrete Component (public interface Coffee with getDescription(), getCost())
 */
public interface OrderPricingComponent {

    /**
     * Calculates the cumulative monetary cost of this component and its decorators.
     */
    BigDecimal getCost();

    /**
     * Returns an itemized description including base cost and all applied decorators.
     */
    String getDescription();
}
