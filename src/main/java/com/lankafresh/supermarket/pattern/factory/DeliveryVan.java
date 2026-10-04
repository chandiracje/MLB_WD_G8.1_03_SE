package com.lankafresh.supermarket.pattern.factory;

/**
 * Concrete Product: Delivery Van / Car ("CAR" / "VAN").
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slide 31):
 *   "Car implements Vehicle -> drive() -> Driving a Car"
 */
public class DeliveryVan implements DeliveryVehicle {

    @Override
    public String dispatch(Long orderId, String trackingNumber, String destinationAddress) {
        return String.format("[VAN DISPATCH] Standard Delivery Van dispatched for Order #%d (%s) to %s. Household grocery crates loaded safely.",
                orderId, trackingNumber, destinationAddress);
    }

    @Override
    public String getVehicleType() {
        return "VAN";
    }

    @Override
    public int getMaxCapacityKg() {
        return 200; // Max 200kg for standard domestic grocery bags
    }

    @Override
    public boolean isTemperatureControlled() {
        return false;
    }
}
