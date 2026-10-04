package com.lankafresh.supermarket.pattern.decorator;

import java.math.BigDecimal;

/**
 * Concrete Component: Base Grocery Order Cost.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slide 43):
 *   "public class SimpleCoffee implements Coffee {
 *        public String getDescription() { return "Simple Coffee"; }
 *        public double getCost() { return 2.0; }
 *    }"
 */
public class BaseOrderCost implements OrderPricingComponent {

    private final BigDecimal baseCost;

    public BaseOrderCost(BigDecimal baseCost) {
        this.baseCost = (baseCost != null && baseCost.compareTo(BigDecimal.ZERO) >= 0)
                ? baseCost
                : BigDecimal.ZERO;
    }

    @Override
    public BigDecimal getCost() {
        return baseCost;
    }

    @Override
    public String getDescription() {
        return "Base Grocery Items";
    }
}
