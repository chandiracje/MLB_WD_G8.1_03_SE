package com.lankafresh.supermarket.pattern.factory;

/**
 * Concrete Product: Refrigerated Delivery Truck ("TRUCK").
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slide 31):
 *   "Truck implements Vehicle -> drive() -> Driving a Truck"
 */
public class RefrigeratedTruck implements DeliveryVehicle {

    @Override
    public String dispatch(Long orderId, String trackingNumber, String destinationAddress) {
        return String.format("[TRUCK DISPATCH] Heavy Cold-Chain Refrigerated Truck dispatched for Order #%d (%s) to %s. Temperature maintained at 4°C.",
                orderId, trackingNumber, destinationAddress);
    }

    @Override
    public String getVehicleType() {
        return "TRUCK";
    }

    @Override
    public int getMaxCapacityKg() {
        return 1200; // Max 1200kg for bulk or heavy commercial crates
    }

    @Override
    public boolean isTemperatureControlled() {
        return true;
    }
}
