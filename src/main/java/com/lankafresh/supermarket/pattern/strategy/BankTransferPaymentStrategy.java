package com.lankafresh.supermarket.pattern.strategy;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Concrete Strategy: Direct Bank Transfer.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slides 18-19):
 *   "BankTransferPayment -> Defines how to process payment via bank transfer"
 */
public class BankTransferPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentResult pay(BigDecimal amount, PaymentContext context) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentResult.failure(getMethodName(), amount, "Invalid payment amount");
        }

        String ref = (context != null && context.getBankReference() != null && !context.getBankReference().isBlank())
                ? context.getBankReference()
                : "BT-REF-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        String txId = "TXN-BANK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String message = String.format("Bank transfer initiated for Rs. %s (Ref: %s). Pending bank deposit verification.",
                amount.toPlainString(), ref);

        return PaymentResult.success(getMethodName(), amount, "PENDING_VERIFICATION", message, txId);
    }

    @Override
    public String getMethodName() {
        return "BANK_TRANSFER";
    }
}
