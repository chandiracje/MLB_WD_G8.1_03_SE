package com.lankafresh.supermarket.dto;

import lombok.Data;

@Data
public class StockAdjustmentRequest {
    private Integer quantityChange;
    private String reason;
}
