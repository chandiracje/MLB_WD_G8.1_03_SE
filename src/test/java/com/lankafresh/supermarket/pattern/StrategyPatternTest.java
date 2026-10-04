package com.lankafresh.supermarket.pattern;

import com.lankafresh.supermarket.pattern.strategy.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Tests for Strategy Design Pattern.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slides 10-24)
 *   Slide 11: Strategies: CreditCardPayment, PayPalPayment, BankTransferPayment
 *   Slide 21: Output: Paid 100 using Credit Card / Paid 200 using PayPal / Paid 300 using Bank Transfer
 */
class StrategyPatternTest {

    private final PaymentContext sampleContext = PaymentContext.builder()
            .orderTrackingNumber("LK-TEST1234")
            .customerName("Sunil Perera")
            .customerEmail("sunil@example.lk")
            .customerPhone("0777123456")
            .deliveryAddress("50 Nawala Road, Nugegoda")
            .cardNumber("5520111122223333")
            .paypalEmail("sunil.perera@paypal.com")
            .bankReference("BOC-SLIP-45892")
            .walletProvider("FriMi")
            .build();

    @Test
    @DisplayName("Verify CreditCardPaymentStrategy execution (Slides 18-21)")
    void testCreditCardStrategy() {
        PaymentStrategy strategy = new CreditCardPaymentStrategy();
        assertEquals("CREDIT_CARD", strategy.getMethodName());

        PaymentResult result = strategy.pay(new BigDecimal("100.00"), sampleContext);
        assertTrue(result.isSuccessful());
        assertEquals("PAID", result.getPaymentStatus());
        assertTrue(result.getMessage().contains("Paid Rs. 100.00 using Credit/Debit Card"));
        assertNotNull(result.getTransactionId());
    }

    @Test
    @DisplayName("Verify PayPalPaymentStrategy execution (Slides 18-21)")
    void testPayPalStrategy() {
        PaymentStrategy strategy = new PayPalPaymentStrategy();
        assertEquals("PAYPAL", strategy.getMethodName());

        PaymentResult result = strategy.pay(new BigDecimal("200.00"), sampleContext);
        assertTrue(result.isSuccessful());
        assertEquals("PAID", result.getPaymentStatus());
        assertTrue(result.getMessage().contains("Paid Rs. 200.00 using PayPal account"));
        assertNotNull(result.getTransactionId());
    }

    @Test
    @DisplayName("Verify BankTransferPaymentStrategy execution (Slides 18-21)")
    void testBankTransferStrategy() {
        PaymentStrategy strategy = new BankTransferPaymentStrategy();
        assertEquals("BANK_TRANSFER", strategy.getMethodName());

        PaymentResult result = strategy.pay(new BigDecimal("300.00"), sampleContext);
        assertTrue(result.isSuccessful());
        assertEquals("PENDING_VERIFICATION", result.getPaymentStatus());
        assertTrue(result.getMessage().contains("Bank transfer initiated for Rs. 300.00"));
        assertNotNull(result.getTransactionId());
    }

    @Test
    @DisplayName("Verify CashOnDeliveryPaymentStrategy execution")
    void testCashOnDeliveryStrategy() {
        PaymentStrategy strategy = new CashOnDeliveryPaymentStrategy();
        assertEquals("COD", strategy.getMethodName());

        PaymentResult result = strategy.pay(new BigDecimal("4500.00"), sampleContext);
        assertTrue(result.isSuccessful());
        assertEquals("PENDING_COD", result.getPaymentStatus());
        assertTrue(result.getMessage().contains("Cash on Delivery booked"));
    }

    @Test
    @DisplayName("Verify MobileWalletPaymentStrategy execution")
    void testMobileWalletStrategy() {
        PaymentStrategy strategy = new MobileWalletPaymentStrategy();
        assertEquals("WALLET", strategy.getMethodName());

        PaymentResult result = strategy.pay(new BigDecimal("1250.00"), sampleContext);
        assertTrue(result.isSuccessful());
        assertEquals("PAID", result.getPaymentStatus());
        assertTrue(result.getMessage().contains("Paid Rs. 1250.00 via Mobile Wallet"));
    }

    @Test
    @DisplayName("Verify strategy validation on non-positive amounts")
    void testInvalidAmountHandling() {
        PaymentStrategy strategy = new CreditCardPaymentStrategy();
        PaymentResult zeroResult = strategy.pay(BigDecimal.ZERO, sampleContext);
        assertFalse(zeroResult.isSuccessful());
        assertEquals("FAILED", zeroResult.getPaymentStatus());

        PaymentResult nullResult = strategy.pay(null, sampleContext);
        assertFalse(nullResult.isSuccessful());
    }
}
