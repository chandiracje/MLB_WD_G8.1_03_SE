package com.lankafresh.supermarket.dto;

import com.lankafresh.supermarket.entity.UserRole;
import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String phone;
    private String address;
    private UserRole role = UserRole.CUSTOMER;
}
