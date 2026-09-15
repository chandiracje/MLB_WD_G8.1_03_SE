package com.lankafresh.supermarket.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private String deliveryAddress;
    private String deliverySlot;
    private String paymentMethod;
    private List<CartItemRequest> items;

    // Guest checkout fields
    private String customerName;
    private String customerEmail;
    private String customerPhone;
}
