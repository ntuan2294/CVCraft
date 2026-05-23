package com.cvcraft.service;

import com.cvcraft.dto.request.*;
import com.cvcraft.dto.response.AuthResponse;
import com.cvcraft.dto.response.MessageResponse;
import com.cvcraft.entity.PasswordResetToken;
import com.cvcraft.entity.User;
import com.cvcraft.exception.BadRequestException;
import com.cvcraft.repository.PasswordResetTokenRepository;
import com.cvcraft.repository.UserRepository;
import com.cvcraft.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final UserDetailsService userDetailsService;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailService emailService;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${app.password-reset.token-expiry-minutes:60}")
    private int tokenExpiryMinutes;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BadRequestException("Email already registered: " + req.email());
        }
        var user = User.builder()
            .email(req.email())
            .password(passwordEncoder.encode(req.password()))
            .fullName(req.fullName())
            .phone(req.phone())
            .role(User.Role.CANDIDATE)
            .isActive(true)
            .isEmailVerified(false)
            .build();
        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        var user = userRepository.findByEmail(req.email()).orElseThrow();
        return buildAuthResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }
        var user = userRepository.findByEmail(email).orElseThrow();
        return buildAuthResponse(user);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest req) {
        // Always return success to prevent email enumeration
        userRepository.findByEmail(req.email()).ifPresent(user -> {
            resetTokenRepository.deleteAllByUserId(user.getId());
            var resetToken = PasswordResetToken.builder()
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(tokenExpiryMinutes))
                .build();
            resetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken());
        });
        return MessageResponse.of("If that email is registered, you will receive a password reset link shortly.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest req) {
        var resetToken = resetTokenRepository.findByToken(req.token())
            .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (resetToken.getUsed()) {
            throw new BadRequestException("This reset link has already been used");
        }
        if (resetToken.isExpired()) {
            throw new BadRequestException("This reset link has expired. Please request a new one.");
        }

        var user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);

        return MessageResponse.of("Password has been reset successfully. You can now log in.");
    }

    @Transactional
    public MessageResponse changePassword(ChangePasswordRequest req) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("User not found"));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (passwordEncoder.matches(req.newPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from the current password");
        }

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        return MessageResponse.of("Password changed successfully");
    }

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        return AuthResponse.of(accessToken, refreshToken, user, jwtExpiration / 1000);
    }
}
