package com.lankafresh.supermarket.pattern.factory;

/**
 * Factory Class for instantiating DeliveryVehicle products.
 * 
 * Lecture Slide Reference:
 * - SE2030 Design Patterns - Part 02:
 *   Slide 32: "3. Create a Factory Class"
 *   public class VehicleFactory {
 *       public Vehicle createVehicle(String type) {
 *           if (type.equalsIgnoreCase("CAR")) return new Car();
 *           else if (type.equalsIgnoreCase("BIKE")) return new Bike();
 *           else if (type.equalsIgnoreCase("TRUCK")) return new Truck();
 *           else return null;
 *       }
 *   }
 */
public class DeliveryVehicleFactory {

    /**
     * Creates and returns the appropriate DeliveryVehicle matching the slide code syntax.
     * 
     * @param type The vehicle type string ("CAR", "VAN", "BIKE", "TRUCK")
     * @return Concrete DeliveryVehicle instance or throws IllegalArgumentException.
     */
    public static DeliveryVehicle createVehicle(String type) {
        if (type == null) {
            return new DeliveryVan(); // Default to standard delivery van
        }

        if (type.equalsIgnoreCase("CAR") || type.equalsIgnoreCase("VAN")) {
            return new DeliveryVan();
        } else if (type.equalsIgnoreCase("BIKE") || type.equalsIgnoreCase("MOTORBIKE")) {
            return new DeliveryMotorbike();
        } else if (type.equalsIgnoreCase("TRUCK") || type.equalsIgnoreCase("LORRY")) {
            return new RefrigeratedTruck();
        } else {
            // Default fallback
            return new DeliveryVan();
        }
    }

    /**
     * Smart factory method to automatically choose the best vehicle for an order
     * based on item count, delivery slot, and perishable requirements.
     */
    public static DeliveryVehicle selectVehicleForOrder(int itemCount, boolean isExpress, boolean requiresColdChain) {
        if (requiresColdChain || itemCount >= 30) {
            return new RefrigeratedTruck();
        } else if (isExpress && itemCount <= 8) {
            return new DeliveryMotorbike();
        } else {
            return new DeliveryVan();
        }
    }
}
