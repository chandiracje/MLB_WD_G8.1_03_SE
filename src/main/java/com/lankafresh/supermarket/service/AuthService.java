package com.lankafresh.supermarket.service;

import com.lankafresh.supermarket.config.JwtUtils;
import com.lankafresh.supermarket.dto.AuthRequest;
import com.lankafresh.supermarket.dto.AuthResponse;
import com.lankafresh.supermarket.dto.RegisterRequest;
import com.lankafresh.supermarket.dto.UpdateProfileRequest;
import com.lankafresh.supermarket.entity.Cart;
import com.lankafresh.supermarket.entity.User;
import com.lankafresh.supermarket.entity.UserRole;
import com.lankafresh.supermarket.repository.CartRepository;
import com.lankafresh.supermarket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getEmail() == null || !request.getEmail().trim().matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
            throw new RuntimeException("Invalid email format. Please provide a valid email address.");
        }

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new RuntimeException("Email is already registered!");
        }

        if (request.getPassword() == null || request.getPassword().length() <= 8) {
            throw new RuntimeException("Password must be more than 8 characters long (at least 9 characters).");
        }

        if (!request.getPassword().matches(".*[a-zA-Z].*")) {
            throw new RuntimeException("Password must contain at least one letter.");
        }

        if (!request.getPassword().matches(".*[0-9].*")) {
            throw new RuntimeException("Password must contain at least one number.");
        }

        String validatedPhone = validateAndNormalizePhone(request.getPhone());

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(validatedPhone)
                .address(request.getAddress())
                .role(request.getRole() != null ? request.getRole() : UserRole.CUSTOMER)
                .build();

        user = userRepository.save(user);

        // Create a default empty cart for customers
        if (user.getRole() == UserRole.CUSTOMER) {
            Cart cart = Cart.builder().user(user).build();
            cartRepository.save(cart);
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phone(user.getPhone())
                .address(user.getAddress())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phone(user.getPhone())
                .address(user.getAddress())
                .build();
    }

    public User getProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    @Transactional
    public User updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(validateAndNormalizePhone(request.getPhone()));
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Current password does not match.");
            }
            if (request.getNewPassword().length() < 6) {
                throw new RuntimeException("New password must be at least 6 characters.");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        return userRepository.save(user);
    }

    private String validateAndNormalizePhone(String phone) {
        if (phone == null || phone.trim().isBlank()) {
            throw new RuntimeException("Mobile number is required!");
        }
        String cleanPhone = phone.trim().replaceAll("[\\s-]", "");
        if (!cleanPhone.matches("^(?:0|\\+94|94)?7[0-9]{8}$")) {
            throw new RuntimeException("Invalid mobile number format. Please provide a valid 10-digit Sri Lankan mobile number starting with 07 (e.g., 0771234567 or +94771234567).");
        }
        if (cleanPhone.startsWith("+94")) {
            return "0" + cleanPhone.substring(3);
        } else if (cleanPhone.startsWith("94")) {
            return "0" + cleanPhone.substring(2);
        } else if (!cleanPhone.startsWith("0")) {
            return "0" + cleanPhone;
        }
        return cleanPhone;
    }
}
