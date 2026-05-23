package com.cvcraft.dto.request;

import jakarta.validation.constraints.*;

public record RegisterRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    String password,

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @Pattern(regexp = "^[\\p{L}\\s'.-]+$", message = "Full name contains invalid characters")
    String fullName,

    @Pattern(
        regexp = "^(\\+84|0)(3[2-9]|5[6-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{7}$",
        message = "Invalid Vietnamese phone number format (e.g. 0912345678 or +84912345678)"
    )
    String phone
) {}
