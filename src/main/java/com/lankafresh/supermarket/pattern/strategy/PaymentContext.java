package com.lankafresh.supermarket.pattern.strategy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Context data passed to PaymentStrategy algorithms during checkout execution.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slides 10-21)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentContext {
    private String orderTrackingNumber;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String deliveryAddress;

    // Optional payment-specific credentials
    private String cardNumber;
    private String cardExpiry;
    private String cardCvv;
    private String paypalEmail;
    private String bankReference;
    private String walletNumber;
    private String walletProvider;
}
