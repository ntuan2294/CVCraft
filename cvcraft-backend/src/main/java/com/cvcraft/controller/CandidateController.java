package com.cvcraft.controller;

import com.cvcraft.dto.request.UpdateCandidateProfileRequest;
import com.cvcraft.dto.response.CandidateResponse;
import com.cvcraft.service.CandidateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
@Tag(name = "Profile")
public class CandidateController {

    private final CandidateService candidateService;

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my CV profile")
    public CandidateResponse getMyProfile(@AuthenticationPrincipal UserDetails currentUser) {
        return candidateService.getMyProfile(currentUser.getUsername());
    }

    @PutMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update my CV profile")
    public CandidateResponse updateMyProfile(
        @RequestBody UpdateCandidateProfileRequest req,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return candidateService.updateProfile(currentUser.getUsername(), req);
    }
}
