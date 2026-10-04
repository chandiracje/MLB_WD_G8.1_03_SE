package com.lankafresh.supermarket.pattern.strategy;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Concrete Strategy: Credit / Debit Card Payment.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slides 18-19):
 *   "CreditCardPayment -> Defines how to process payment using a credit card"
 */
public class CreditCardPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentResult pay(BigDecimal amount, PaymentContext context) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentResult.failure(getMethodName(), amount, "Invalid payment amount");
        }

        // Mask card number for PCI-DSS compliance display
        String cardMasked = (context != null && context.getCardNumber() != null && context.getCardNumber().length() >= 4)
                ? "**** **** **** " + context.getCardNumber().substring(context.getCardNumber().length() - 4)
                : "**** **** **** 8899";

        String txId = "TXN-CARD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String message = String.format("Paid Rs. %s using Credit/Debit Card (%s). Gateway authorization successful.",
                amount.toPlainString(), cardMasked);

        return PaymentResult.success(getMethodName(), amount, "PAID", message, txId);
    }

    @Override
    public String getMethodName() {
        return "CREDIT_CARD";
    }
}
