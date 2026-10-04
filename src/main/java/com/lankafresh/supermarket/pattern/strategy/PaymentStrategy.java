package com.lankafresh.supermarket.pattern.strategy;

import java.math.BigDecimal;

/**
 * Common strategy interface for processing supermarket checkout payments.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02:
 *   Slide 11: "Each implements a common interface PaymentStrategy"
 *   Slide 14: Strategy Pattern - UML Class Diagram
 *   Slide 17: "The common interface that all strategies must follow.
 *              It defines a method but doesn't provide implementation."
 */
public interface PaymentStrategy {

    /**
     * Executes the payment algorithm for the given order amount and context.
     * 
     * @param amount The total order monetary amount to charge.
     * @param context Customer and order checkout details.
     * @return PaymentResult containing status, transaction ID, and confirmation message.
     */
    PaymentResult pay(BigDecimal amount, PaymentContext context);

    /**
     * Identifies the payment method string identifier (e.g., "CREDIT_CARD", "PAYPAL", "BANK_TRANSFER", "COD").
     */
    String getMethodName();
}
