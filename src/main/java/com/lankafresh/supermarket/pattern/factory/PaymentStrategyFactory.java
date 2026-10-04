package com.lankafresh.supermarket.pattern.factory;

import com.lankafresh.supermarket.pattern.strategy.*;

/**
 * Factory Pattern for creating PaymentStrategy instances.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02:
 *   Slide 26: "Defines an interface for creating objects. Subclasses/factory decide which class to instantiate."
 *   Slide 27: "Centralizes object creation logic. Makes client code cleaner & more readable."
 *   Slide 32: "Create a Factory Class"
 */
public class PaymentStrategyFactory {

    /**
     * Factory Method to instantiate the appropriate PaymentStrategy algorithm.
     * 
     * @param paymentMethod Name of the payment method (e.g. CARD, CREDITCARD, PAYPAL, BANK, COD, WALLET).
     * @return Concrete PaymentStrategy implementation.
     */
    public static PaymentStrategy getPaymentStrategy(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            return new CreditCardPaymentStrategy(); // Default fallback
        }

        String normalized = paymentMethod.trim().toUpperCase().replace(" ", "_");

        if (normalized.contains("CREDIT") || normalized.contains("DEBIT") || normalized.contains("CARD")) {
            return new CreditCardPaymentStrategy();
        } else if (normalized.contains("PAYPAL")) {
            return new PayPalPaymentStrategy();
        } else if (normalized.contains("BANK") || normalized.contains("TRANSFER")) {
            return new BankTransferPaymentStrategy();
        } else if (normalized.contains("COD") || normalized.contains("CASH")) {
            return new CashOnDeliveryPaymentStrategy();
        } else if (normalized.contains("WALLET") || normalized.contains("FRIMI") || normalized.contains("EZCASH") || normalized.contains("GENIE")) {
            return new MobileWalletPaymentStrategy();
        } else {
            // Default to credit card for unknown methods
            return new CreditCardPaymentStrategy();
        }
    }
}
