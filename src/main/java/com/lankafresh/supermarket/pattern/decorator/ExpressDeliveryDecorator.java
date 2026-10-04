package com.lankafresh.supermarket.pattern.decorator;

import java.math.BigDecimal;

/**
 * Concrete Decorator: Expedited Express Delivery (within 60 minutes).
 */
public class ExpressDeliveryDecorator extends OrderCostDecorator {

    private static final BigDecimal EXPRESS_SURCHARGE = new BigDecimal("350.00");

    public ExpressDeliveryDecorator(OrderPricingComponent decoratedOrder) {
        super(decoratedOrder);
    }

    @Override
    public BigDecimal getCost() {
        return decoratedOrder.getCost().add(EXPRESS_SURCHARGE);
    }

    @Override
    public String getDescription() {
        return decoratedOrder.getDescription() + " + 60-Min Express Dispatch (Rs. 350)";
    }
}
