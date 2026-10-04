package com.lankafresh.supermarket.pattern.factory;

/**
 * Concrete Product: Delivery Motorbike ("BIKE").
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02 (Slide 31):
 *   "Bike implements Vehicle -> drive() -> Riding a Bike"
 */
public class DeliveryMotorbike implements DeliveryVehicle {

    @Override
    public String dispatch(Long orderId, String trackingNumber, String destinationAddress) {
        return String.format("[BIKE DISPATCH] Express Courier dispatched on Motorbike for Order #%d (%s) to %s. Estimated arrival: within 30-45 mins.",
                orderId, trackingNumber, destinationAddress);
    }

    @Override
    public String getVehicleType() {
        return "BIKE";
    }

    @Override
    public int getMaxCapacityKg() {
        return 15; // Max 15kg for light grocery baskets
    }

    @Override
    public boolean isTemperatureControlled() {
        return false;
    }
}
