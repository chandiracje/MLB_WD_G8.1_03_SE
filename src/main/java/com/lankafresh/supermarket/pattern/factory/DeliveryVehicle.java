package com.lankafresh.supermarket.pattern.factory;

/**
 * Common Product Interface for Supermarket Logistics Delivery Vehicles.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02:
 *   Slide 29: "Transport Management System: Car, Bike, Truck"
 *   Slide 30: "1. Defines Common Interface: Vehicle with drive():void"
 */
public interface DeliveryVehicle {

    /**
     * Executes order delivery dispatch via this vehicle.
     */
    String dispatch(Long orderId, String trackingNumber, String destinationAddress);

    /**
     * Returns vehicle classification name (BIKE, VAN, TRUCK).
     */
    String getVehicleType();

    /**
     * Maximum payload capacity in kilograms.
     */
    int getMaxCapacityKg();

    /**
     * Indicates whether the vehicle supports cold-chain refrigerated cargo.
     */
    boolean isTemperatureControlled();
}
