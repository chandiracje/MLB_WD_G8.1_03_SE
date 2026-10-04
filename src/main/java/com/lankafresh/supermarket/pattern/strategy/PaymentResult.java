package com.lankafresh.supermarket.pattern.strategy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Standard output result returned by every PaymentStrategy implementation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResult {
    private boolean successful;
    private String paymentMethod;
    private BigDecimal amount;
    private String transactionId;
    private String paymentStatus; // e.g. "PAID", "PENDING_COD", "PENDING_VERIFICATION", "FAILED"
    private String message;
    private LocalDateTime processedAt;

    public static PaymentResult success(String method, BigDecimal amount, String status, String message, String txId) {
        return PaymentResult.builder()
                .successful(true)
                .paymentMethod(method)
                .amount(amount)
                .transactionId(txId)
                .paymentStatus(status)
                .message(message)
                .processedAt(LocalDateTime.now())
                .build();
    }

    public static PaymentResult failure(String method, BigDecimal amount, String message) {
        return PaymentResult.builder()
                .successful(false)
                .paymentMethod(method)
                .amount(amount)
                .paymentStatus("FAILED")
                .message(message)
                .processedAt(LocalDateTime.now())
                .build();
    }
}
