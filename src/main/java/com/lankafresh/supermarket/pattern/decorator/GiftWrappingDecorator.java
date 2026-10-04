package com.lankafresh.supermarket.pattern.decorator;

import java.math.BigDecimal;

/**
 * Concrete Decorator: Gift Wrapping & Greeting Card.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slide 45):
 *   "public class MilkDecorator extends CoffeeDecorator {
 *        public MilkDecorator(Coffee coffee) { super(coffee); }
 *        public String getDescription() { return decoratedCoffee.getDescription() + ", Milk"; }
 *        public double getCost() { return decoratedCoffee.getCost() + 0.5; }
 *    }"
 */
public class GiftWrappingDecorator extends OrderCostDecorator {

    private static final BigDecimal GIFT_WRAP_SURCHARGE = new BigDecimal("150.00");

    public GiftWrappingDecorator(OrderPricingComponent decoratedOrder) {
        super(decoratedOrder);
    }

    @Override
    public BigDecimal getCost() {
        return decoratedOrder.getCost().add(GIFT_WRAP_SURCHARGE);
    }

    @Override
    public String getDescription() {
        return decoratedOrder.getDescription() + " + Premium Gift Wrap (Rs. 150)";
    }
}
