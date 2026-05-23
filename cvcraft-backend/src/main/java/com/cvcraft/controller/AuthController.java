package com.cvcraft.controller;

import com.cvcraft.dto.request.*;
import com.cvcraft.dto.response.AuthResponse;
import com.cvcraft.dto.response.MessageResponse;
import com.cvcraft.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new candidate user — sends OTP to email")
    public MessageResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive JWT tokens")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using refresh token")
    public AuthResponse refresh(@RequestParam String refreshToken) {
        return authService.refresh(refreshToken);
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with 6-digit OTP code")
    public AuthResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        return authService.verifyEmail(req);
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend email verification OTP")
    public MessageResponse resendVerification(@Valid @RequestBody ResendVerificationRequest req) {
        return authService.resendVerification(req);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset email")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        return authService.forgotPassword(req);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using token from email")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        return authService.resetPassword(req);
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change password for authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
    public MessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        return authService.changePassword(req);
    }
}
