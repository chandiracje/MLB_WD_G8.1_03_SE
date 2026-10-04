package com.lankafresh.supermarket.pattern.decorator;

import java.math.BigDecimal;

/**
 * Abstract Decorator for Order Pricing.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slide 44):
 *   "public abstract class CoffeeDecorator implements Coffee {
 *        protected Coffee decoratedCoffee;
 *        public CoffeeDecorator(Coffee coffee) {
 *            this.decoratedCoffee = coffee;
 *        }
 *        public String getDescription() { return decoratedCoffee.getDescription(); }
 *        public double getCost() { return decoratedCoffee.getCost(); }
 *    }"
 */
public abstract class OrderCostDecorator implements OrderPricingComponent {

    protected final OrderPricingComponent decoratedOrder;

    public OrderCostDecorator(OrderPricingComponent decoratedOrder) {
        if (decoratedOrder == null) {
            throw new IllegalArgumentException("decoratedOrder cannot be null");
        }
        this.decoratedOrder = decoratedOrder;
    }

    @Override
    public BigDecimal getCost() {
        return decoratedOrder.getCost();
    }

    @Override
    public String getDescription() {
        return decoratedOrder.getDescription();
    }
}
