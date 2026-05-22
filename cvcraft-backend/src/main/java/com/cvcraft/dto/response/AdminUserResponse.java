package com.cvcraft.dto.response;

import com.cvcraft.entity.User;

import java.time.LocalDateTime;

public record AdminUserResponse(
    Long id,
    String email,
    String fullName,
    String phone,
    User.Role role,
    Boolean isActive,
    Boolean isEmailVerified,
    long cvCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static AdminUserResponse from(User user, long cvCount) {
        return new AdminUserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getPhone(),
            user.getRole(),
            user.getIsActive(),
            user.getIsEmailVerified(),
            cvCount,
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
