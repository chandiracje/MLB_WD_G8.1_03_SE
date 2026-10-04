package com.lankafresh.supermarket.pattern.strategy;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Concrete Strategy: PayPal Digital Payment.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slides 18-19):
 *   "PayPalPayment -> Defines how to process payment via paypal"
 */
public class PayPalPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentResult pay(BigDecimal amount, PaymentContext context) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentResult.failure(getMethodName(), amount, "Invalid payment amount");
        }

        String paypalAccount = (context != null && context.getPaypalEmail() != null && !context.getPaypalEmail().isBlank())
                ? context.getPaypalEmail()
                : (context != null && context.getCustomerEmail() != null ? context.getCustomerEmail() : "customer@paypal.com");

        String txId = "TXN-PP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String message = String.format("Paid Rs. %s using PayPal account (%s). Digital wallet captured.",
                amount.toPlainString(), paypalAccount);

        return PaymentResult.success(getMethodName(), amount, "PAID", message, txId);
    }

    @Override
    public String getMethodName() {
        return "PAYPAL";
    }
}
