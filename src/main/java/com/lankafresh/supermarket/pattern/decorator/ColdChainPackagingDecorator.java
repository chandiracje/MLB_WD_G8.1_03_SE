package com.lankafresh.supermarket.pattern.decorator;

import java.math.BigDecimal;

/**
 * Concrete Decorator: Temperature-Controlled Cold Chain Packaging.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slide 45):
 *   "public class SugarDecorator extends CoffeeDecorator {
 *        public SugarDecorator(Coffee coffee) { super(coffee); }
 *        public String getDescription() { return decoratedCoffee.getDescription() + ", Sugar"; }
 *        public double getCost() { return decoratedCoffee.getCost() + 0.2; }
 *    }"
 */
public class ColdChainPackagingDecorator extends OrderCostDecorator {

    private static final BigDecimal COLD_CHAIN_SURCHARGE = new BigDecimal("250.00");

    public ColdChainPackagingDecorator(OrderPricingComponent decoratedOrder) {
        super(decoratedOrder);
    }

    @Override
    public BigDecimal getCost() {
        return decoratedOrder.getCost().add(COLD_CHAIN_SURCHARGE);
    }

    @Override
    public String getDescription() {
        return decoratedOrder.getDescription() + " + Cold-Chain Thermal Insulation & Ice Packs (Rs. 250)";
    }
}
