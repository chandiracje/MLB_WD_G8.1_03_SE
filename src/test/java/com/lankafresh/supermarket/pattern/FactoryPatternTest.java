package com.lankafresh.supermarket.pattern;

import com.lankafresh.supermarket.pattern.factory.*;
import com.lankafresh.supermarket.pattern.strategy.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Tests for Factory Design Pattern.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slides 25-36)
 *   Slide 32: "Create a Factory Class: VehicleFactory"
 *   Slide 33: "Vehicle v1 = factory.createVehicle("CAR");
 *              Vehicle v2 = factory.createVehicle("BIKE");
 *              Vehicle v3 = factory.createVehicle("TRUCK");"
 */
class FactoryPatternTest {

    @Test
    @DisplayName("Verify DeliveryVehicleFactory creates correct concrete products (Slides 31-33)")
    void testVehicleFactoryCreation() {
        DeliveryVehicle bike = DeliveryVehicleFactory.createVehicle("BIKE");
        assertNotNull(bike);
        assertTrue(bike instanceof DeliveryMotorbike);
        assertEquals("BIKE", bike.getVehicleType());
        assertEquals(15, bike.getMaxCapacityKg());
        assertFalse(bike.isTemperatureControlled());

        DeliveryVehicle car = DeliveryVehicleFactory.createVehicle("CAR");
        assertNotNull(car);
        assertTrue(car instanceof DeliveryVan);
        assertEquals("VAN", car.getVehicleType());
        assertEquals(200, car.getMaxCapacityKg());

        DeliveryVehicle van = DeliveryVehicleFactory.createVehicle("VAN");
        assertTrue(van instanceof DeliveryVan);

        DeliveryVehicle truck = DeliveryVehicleFactory.createVehicle("TRUCK");
        assertNotNull(truck);
        assertTrue(truck instanceof RefrigeratedTruck);
        assertEquals("TRUCK", truck.getVehicleType());
        assertEquals(1200, truck.getMaxCapacityKg());
        assertTrue(truck.isTemperatureControlled());
    }

    @Test
    @DisplayName("Verify Vehicle dispatch method polymorphism (Slide 33)")
    void testVehicleDispatchPolymorphism() {
        DeliveryVehicle bike = DeliveryVehicleFactory.createVehicle("BIKE");
        String bikeDispatch = bike.dispatch(101L, "LK-BIKE001", "Colombo 07");
        assertTrue(bikeDispatch.contains("[BIKE DISPATCH]"));
        assertTrue(bikeDispatch.contains("Express Courier dispatched on Motorbike"));

        DeliveryVehicle truck = DeliveryVehicleFactory.createVehicle("TRUCK");
        String truckDispatch = truck.dispatch(102L, "LK-TRUCK002", "Negombo Central Depot");
        assertTrue(truckDispatch.contains("[TRUCK DISPATCH]"));
        assertTrue(truckDispatch.contains("Cold-Chain"));
    }

    @Test
    @DisplayName("Verify Smart Vehicle selection based on load and temperature requirements")
    void testSmartVehicleSelection() {
        // Express small basket -> Motorbike
        DeliveryVehicle vehicle1 = DeliveryVehicleFactory.selectVehicleForOrder(4, true, false);
        assertTrue(vehicle1 instanceof DeliveryMotorbike);

        // Standard household items -> Delivery Van
        DeliveryVehicle vehicle2 = DeliveryVehicleFactory.selectVehicleForOrder(18, false, false);
        assertTrue(vehicle2 instanceof DeliveryVan);

        // Perishable/Cold-chain goods or bulk (>30) -> Refrigerated Truck
        DeliveryVehicle vehicle3 = DeliveryVehicleFactory.selectVehicleForOrder(8, false, true);
        assertTrue(vehicle3 instanceof RefrigeratedTruck);

        DeliveryVehicle vehicle4 = DeliveryVehicleFactory.selectVehicleForOrder(35, false, false);
        assertTrue(vehicle4 instanceof RefrigeratedTruck);
    }

    @Test
    @DisplayName("Verify PaymentStrategyFactory resolves appropriate strategy")
    void testPaymentStrategyFactory() {
        PaymentStrategy cardStrategy = PaymentStrategyFactory.getPaymentStrategy("CARD");
        assertTrue(cardStrategy instanceof CreditCardPaymentStrategy);

        PaymentStrategy paypalStrategy = PaymentStrategyFactory.getPaymentStrategy("PAYPAL");
        assertTrue(paypalStrategy instanceof PayPalPaymentStrategy);

        PaymentStrategy bankStrategy = PaymentStrategyFactory.getPaymentStrategy("BANK_TRANSFER");
        assertTrue(bankStrategy instanceof BankTransferPaymentStrategy);

        PaymentStrategy codStrategy = PaymentStrategyFactory.getPaymentStrategy("COD");
        assertTrue(codStrategy instanceof CashOnDeliveryPaymentStrategy);

        PaymentStrategy walletStrategy = PaymentStrategyFactory.getPaymentStrategy("WALLET");
        assertTrue(walletStrategy instanceof MobileWalletPaymentStrategy);
    }
}
