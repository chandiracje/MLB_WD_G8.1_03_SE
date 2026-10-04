package com.lankafresh.supermarket.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private String deliveryAddress;
    private String deliverySlot;
    private String deliveryRoute;
    private String scheduledTime;
    private String paymentMethod;
    private List<CartItemRequest> items;

    // Guest checkout fields
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    // Decorator Pattern custom add-on flags (Optional)
    private Boolean giftWrap;
    private Boolean coldChain;
    private Boolean ecoBag;

    // Specific payment details (Optional)
    private String cardNumber;
    private String cardExpiry;
    private String cardCvv;
    private String paypalEmail;
    private String bankReference;
    private String walletProvider;
}
