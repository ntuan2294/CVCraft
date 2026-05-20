package com.cvcraft.dto.response;

import com.cvcraft.entity.User;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    Long expiresIn,
    UserInfo user
) {
    public record UserInfo(Long id, String email, String fullName, String avatarUrl, User.Role role) {}

    public static AuthResponse of(String accessToken, String refreshToken, User user, long expiresIn) {
        return new AuthResponse(
            accessToken, refreshToken, "Bearer", expiresIn,
            new UserInfo(user.getId(), user.getEmail(), user.getFullName(), user.getAvatarUrl(), user.getRole())
        );
    }
}
