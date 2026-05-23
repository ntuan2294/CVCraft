package com.cvcraft.service;

import com.cvcraft.dto.request.*;
import com.cvcraft.dto.response.AuthResponse;
import com.cvcraft.dto.response.MessageResponse;
import com.cvcraft.entity.EmailVerificationOtp;
import com.cvcraft.entity.PasswordResetToken;
import com.cvcraft.entity.User;
import com.cvcraft.exception.BadRequestException;
import com.cvcraft.repository.EmailVerificationOtpRepository;
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

import java.security.SecureRandom;
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
    private final EmailVerificationOtpRepository otpRepository;
    private final EmailService emailService;
    private final EmailValidationService emailValidationService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${app.password-reset.token-expiry-minutes:60}")
    private int tokenExpiryMinutes;

    @Transactional
    public MessageResponse register(RegisterRequest req) {
        emailValidationService.validateOrThrow(req.email());
        if (userRepository.existsByEmail(req.email())) {
            throw new BadRequestException("Email already registered: " + req.email());
        }
        if (req.phone() != null && !req.phone().isBlank() && userRepository.existsByPhone(req.phone())) {
            throw new BadRequestException("Phone number is already linked to another account");
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
        sendOtp(user);
        return MessageResponse.of("Registration successful. Please check your email for the verification code.");
    }

    public AuthResponse login(LoginRequest req) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        var user = userRepository.findByEmail(req.email()).orElseThrow();
        if (!user.getIsEmailVerified()) {
            // Resend OTP and tell frontend to go to verify page
            sendOtp(user);
            throw new EmailNotVerifiedException("Email not verified. A new verification code has been sent to " + req.email());
        }
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
    public AuthResponse verifyEmail(VerifyEmailRequest req) {
        var user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getIsEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        var otp = otpRepository.findTopByUser_IdAndUsedFalseOrderByCreatedAtDesc(user.getId())
            .orElseThrow(() -> new BadRequestException("No active verification code found. Please request a new one."));

        if (otp.isExpired()) {
            throw new BadRequestException("Verification code has expired. Please request a new one.");
        }
        if (!otp.getOtpCode().equals(req.otpCode())) {
            throw new BadRequestException("Invalid verification code");
        }

        otp.setUsed(true);
        otpRepository.save(otp);

        user.setIsEmailVerified(true);
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public MessageResponse resendVerification(ResendVerificationRequest req) {
        var user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getIsEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        // Cooldown: block resend if last OTP was sent less than 60s ago
        otpRepository.findTopByUser_IdAndUsedFalseOrderByCreatedAtDesc(user.getId()).ifPresent(existing -> {
            if (existing.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(60))) {
                throw new BadRequestException("Please wait before requesting a new code");
            }
        });

        sendOtp(user);
        return MessageResponse.of("A new verification code has been sent to your email.");
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest req) {
        emailValidationService.validateOrThrow(req.email());
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

    private void sendOtp(User user) {
        otpRepository.deleteAllByUserId(user.getId());
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        var otp = EmailVerificationOtp.builder()
            .user(user)
            .otpCode(code)
            .expiresAt(LocalDateTime.now().plusMinutes(10))
            .build();
        otpRepository.save(otp);
        emailService.sendVerificationOtpEmail(user.getEmail(), code);
    }

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        return AuthResponse.of(accessToken, refreshToken, user, jwtExpiration / 1000);
    }

    // Custom exception so frontend can detect "needs verification" state
    public static class EmailNotVerifiedException extends RuntimeException {
        public EmailNotVerifiedException(String message) { super(message); }
    }
}
