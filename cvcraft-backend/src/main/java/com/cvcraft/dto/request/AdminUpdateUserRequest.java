package com.cvcraft.dto.request;

import com.cvcraft.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminUpdateUserRequest(
    @Email @NotBlank String email,
    @Size(min = 8, message = "Password must be at least 8 characters") String password,
    @NotBlank String fullName,
    String phone,
    @NotNull User.Role role,
    @NotNull Boolean isActive,
    @NotNull Boolean isEmailVerified
) {}
