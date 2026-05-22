package com.cvcraft.controller;

import com.cvcraft.dto.request.LoginRequest;
import com.cvcraft.dto.request.RegisterRequest;
import com.cvcraft.dto.response.AuthResponse;
import com.cvcraft.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
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
    @Operation(summary = "Register a new candidate user")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
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
}
