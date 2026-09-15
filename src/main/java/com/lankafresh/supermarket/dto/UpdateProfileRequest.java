package com.lankafresh.supermarket.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String phone;
    private String address;
    private String currentPassword;
    private String newPassword;
}
