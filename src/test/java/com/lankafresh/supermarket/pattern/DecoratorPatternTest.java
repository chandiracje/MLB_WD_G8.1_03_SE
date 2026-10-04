package com.lankafresh.supermarket.pattern;

import com.lankafresh.supermarket.pattern.decorator.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Tests for Decorator Design Pattern.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slides 37-49)
 *   Slide 41: SimpleCoffee -> MilkDecorator -> SugarDecorator
 *   Slide 46: Client Code (Main)
 *             Coffee coffee = new SimpleCoffee();
 *             coffee = new MilkDecorator(coffee);
 *             coffee = new SugarDecorator(coffee);
 */
class DecoratorPatternTest {

    @Test
    @DisplayName("Verify Base Order Cost component without decorators (Slide 43)")
    void testBaseOrderCost() {
        OrderPricingComponent order = new BaseOrderCost(new BigDecimal("1000.00"));
        assertEquals(new BigDecimal("1000.00"), order.getCost());
        assertEquals("Base Grocery Items", order.getDescription());
    }

    @Test
    @DisplayName("Verify Dynamic Decorator Chaining with Gift Wrap & Cold Chain (Slide 46)")
    void testDecoratorChaining() {
        // Base grocery items = Rs. 2000.00
        OrderPricingComponent order = new BaseOrderCost(new BigDecimal("2000.00"));

        // Wrap with GiftWrappingDecorator (+ Rs. 150.00)
        order = new GiftWrappingDecorator(order);
        assertEquals(new BigDecimal("2150.00"), order.getCost());
        assertTrue(order.getDescription().contains("Gift Wrap"));

        // Wrap with ColdChainPackagingDecorator (+ Rs. 250.00)
        order = new ColdChainPackagingDecorator(order);
        assertEquals(new BigDecimal("2400.00"), order.getCost());
        assertTrue(order.getDescription().contains("Cold-Chain"));

        // Wrap with ExpressDeliveryDecorator (+ Rs. 350.00)
        order = new ExpressDeliveryDecorator(order);
        assertEquals(new BigDecimal("2750.00"), order.getCost());
        assertTrue(order.getDescription().contains("Express Dispatch"));

        // Wrap with EcoFriendlyBagDecorator (+ Rs. 75.00)
        order = new EcoFriendlyBagDecorator(order);
        assertEquals(new BigDecimal("2825.00"), order.getCost());
        assertTrue(order.getDescription().contains("Eco-Friendly"));
    }

    @Test
    @DisplayName("Verify Order independence and permutation flexibility (Slide 48)")
    void testFlexibleCombinations() {
        // Decorators can be chained in any order at runtime without subclass explosion
        OrderPricingComponent order1 = new ExpressDeliveryDecorator(new BaseOrderCost(new BigDecimal("500.00")));
        assertEquals(new BigDecimal("850.00"), order1.getCost());

        OrderPricingComponent order2 = new EcoFriendlyBagDecorator(new GiftWrappingDecorator(new BaseOrderCost(new BigDecimal("500.00"))));
        assertEquals(new BigDecimal("725.00"), order2.getCost());
    }

    @Test
    @DisplayName("Verify Null check on decorator constructor")
    void testNullValidation() {
        assertThrows(IllegalArgumentException.class, () -> new GiftWrappingDecorator(null));
        assertThrows(IllegalArgumentException.class, () -> new ColdChainPackagingDecorator(null));
    }
}
