package com.lankafresh.supermarket.pattern.singleton;

import java.math.BigDecimal;

/**
 * Singleton Pattern implementation for LankaFresh Supermarket System Configuration.
 * 
 * Lecture Slide Reference:
 * - SE2030 Lecture 8: Design Patterns - Part I (Slides 14-27)
 * 
 * Key Principles:
 * 1. Private constructor prevents direct instantiation from outside classes.
 * 2. Private static volatile instance variable ensures a single instance across the JVM.
 * 3. Public static getInstance() method provides a global access point with thread-safe
 *    Double-Checked Locking (DCL).
 */
public class SupermarketSystemConfig {

    // Volatile instance ensures thread visibility and prevents instruction reordering
    private static volatile SupermarketSystemConfig instance;

    // Global configurable store properties
    private String storeName;
    private String currencyCode;
    private BigDecimal standardDeliveryFee;
    private BigDecimal expressDeliveryFee;
    private BigDecimal freeDeliveryThreshold;
    private BigDecimal taxRatePercentage;
    private int lowStockAlertThreshold;
    private String operatingHours;
    private String supportHotline;
    private String contactEmail;
    private boolean maintenanceMode;

    /**
     * Step #1: Private constructor to prevent direct instantiation (Slide 18)
     */
    private SupermarketSystemConfig() {
        // Initialize with default supermarket parameters
        this.storeName = "LankaFresh Supermarket (Pvt) Ltd";
        this.currencyCode = "LKR";
        this.standardDeliveryFee = new BigDecimal("250.00");
        this.expressDeliveryFee = new BigDecimal("350.00");
        this.freeDeliveryThreshold = new BigDecimal("5000.00");
        this.taxRatePercentage = new BigDecimal("2.50"); // 2.5% VAT/NBT
        this.lowStockAlertThreshold = 10;
        this.operatingHours = "07:00 AM - 10:00 PM (Daily)";
        this.supportHotline = "+94 11 234 5678";
        this.contactEmail = "support@lankafresh.lk";
        this.maintenanceMode = false;
    }

    /**
     * Step #3: Provide a static method to get the single instance (Slides 20-23)
     * Implements Double-Checked Locking for high-performance thread safety.
     */
    public static SupermarketSystemConfig getInstance() {
        if (instance == null) { // First check (no locking overhead)
            synchronized (SupermarketSystemConfig.class) {
                if (instance == null) { // Second check inside synchronized block
                    instance = new SupermarketSystemConfig();
                }
            }
        }
        return instance;
    }

    /**
     * Resets the configuration back to default values (useful for testing).
     */
    public synchronized void resetToDefaults() {
        this.storeName = "LankaFresh Supermarket (Pvt) Ltd";
        this.currencyCode = "LKR";
        this.standardDeliveryFee = new BigDecimal("250.00");
        this.expressDeliveryFee = new BigDecimal("350.00");
        this.freeDeliveryThreshold = new BigDecimal("5000.00");
        this.taxRatePercentage = new BigDecimal("2.50");
        this.lowStockAlertThreshold = 10;
        this.operatingHours = "07:00 AM - 10:00 PM (Daily)";
        this.supportHotline = "+94 11 234 5678";
        this.contactEmail = "support@lankafresh.lk";
        this.maintenanceMode = false;
    }

    // Getters and Setters for runtime dynamic configuration
    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }

    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }

    public BigDecimal getStandardDeliveryFee() { return standardDeliveryFee; }
    public void setStandardDeliveryFee(BigDecimal standardDeliveryFee) { this.standardDeliveryFee = standardDeliveryFee; }

    public BigDecimal getExpressDeliveryFee() { return expressDeliveryFee; }
    public void setExpressDeliveryFee(BigDecimal expressDeliveryFee) { this.expressDeliveryFee = expressDeliveryFee; }

    public BigDecimal getFreeDeliveryThreshold() { return freeDeliveryThreshold; }
    public void setFreeDeliveryThreshold(BigDecimal freeDeliveryThreshold) { this.freeDeliveryThreshold = freeDeliveryThreshold; }

    public BigDecimal getTaxRatePercentage() { return taxRatePercentage; }
    public void setTaxRatePercentage(BigDecimal taxRatePercentage) { this.taxRatePercentage = taxRatePercentage; }

    public int getLowStockAlertThreshold() { return lowStockAlertThreshold; }
    public void setLowStockAlertThreshold(int lowStockAlertThreshold) { this.lowStockAlertThreshold = lowStockAlertThreshold; }

    public String getOperatingHours() { return operatingHours; }
    public void setOperatingHours(String operatingHours) { this.operatingHours = operatingHours; }

    public String getSupportHotline() { return supportHotline; }
    public void setSupportHotline(String supportHotline) { this.supportHotline = supportHotline; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public boolean isMaintenanceMode() { return maintenanceMode; }
    public void setMaintenanceMode(boolean maintenanceMode) { this.maintenanceMode = maintenanceMode; }
}
