package com.lankafresh.supermarket.pattern.decorator;

import java.math.BigDecimal;

/**
 * Concrete Decorator: Reusable Eco-Friendly Jute Bag Packaging.
 */
public class EcoFriendlyBagDecorator extends OrderCostDecorator {

    private static final BigDecimal ECO_BAG_SURCHARGE = new BigDecimal("75.00");

    public EcoFriendlyBagDecorator(OrderPricingComponent decoratedOrder) {
        super(decoratedOrder);
    }

    @Override
    public BigDecimal getCost() {
        return decoratedOrder.getCost().add(ECO_BAG_SURCHARGE);
    }

    @Override
    public String getDescription() {
        return decoratedOrder.getDescription() + " + Eco-Friendly Reusable Bag (Rs. 75)";
    }
}
