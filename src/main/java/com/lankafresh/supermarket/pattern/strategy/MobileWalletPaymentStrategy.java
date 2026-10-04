package com.lankafresh.supermarket.pattern.strategy;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Concrete Strategy: Mobile Wallet Payment (e.g., FriMi, eZ Cash, mCash, Genie).
 */
public class MobileWalletPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentResult pay(BigDecimal amount, PaymentContext context) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentResult.failure(getMethodName(), amount, "Invalid payment amount");
        }

        String provider = (context != null && context.getWalletProvider() != null && !context.getWalletProvider().isBlank())
                ? context.getWalletProvider()
                : "FriMi / eZ Cash";

        String mobile = (context != null && context.getWalletNumber() != null && !context.getWalletNumber().isBlank())
                ? context.getWalletNumber()
                : (context != null && context.getCustomerPhone() != null ? context.getCustomerPhone() : "0771234567");

        String txId = "TXN-WALLET-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String message = String.format("Paid Rs. %s via Mobile Wallet (%s - %s). Instant digital debit authorized.",
                amount.toPlainString(), provider, mobile);

        return PaymentResult.success(getMethodName(), amount, "PAID", message, txId);
    }

    @Override
    public String getMethodName() {
        return "WALLET";
    }
}
