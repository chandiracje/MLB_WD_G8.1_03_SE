package com.lankafresh.supermarket.pattern.strategy;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Concrete Strategy: Cash On Delivery (COD).
 */
public class CashOnDeliveryPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentResult pay(BigDecimal amount, PaymentContext context) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentResult.failure(getMethodName(), amount, "Invalid payment amount");
        }

        String txId = "TXN-COD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String message = String.format("Cash on Delivery booked for Rs. %s. Exact cash to be collected by driver upon doorstep delivery.",
                amount.toPlainString());

        return PaymentResult.success(getMethodName(), amount, "PENDING_COD", message, txId);
    }

    @Override
    public String getMethodName() {
        return "COD";
    }
}
