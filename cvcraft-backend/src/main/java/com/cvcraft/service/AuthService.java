package com.cvcraft.service;

import com.cvcraft.dto.request.LoginRequest;
import com.cvcraft.dto.request.RegisterRequest;
import com.cvcraft.dto.response.AuthResponse;
import com.cvcraft.entity.User;
import com.cvcraft.exception.BadRequestException;
import com.cvcraft.repository.UserRepository;
import com.cvcraft.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final UserDetailsService userDetailsService;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

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

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        return AuthResponse.of(accessToken, refreshToken, user, jwtExpiration / 1000);
    }
}
