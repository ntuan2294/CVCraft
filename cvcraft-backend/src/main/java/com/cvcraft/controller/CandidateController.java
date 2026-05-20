package com.cvcraft.controller;

import com.cvcraft.dto.request.UpdateCandidateProfileRequest;
import com.cvcraft.dto.response.CandidateResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.service.CandidateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/candidates")
@RequiredArgsConstructor
@Tag(name = "Candidates")
public class CandidateController {

    private final CandidateService candidateService;

    @GetMapping
    @Operation(summary = "Browse and filter candidates")
    public PageResponse<CandidateResponse> searchCandidates(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) String experienceLevel,
        @RequestParam(required = false) Boolean isOpenToWork,
        @RequestParam(required = false) String workMode,
        @RequestParam(required = false) Integer minExp,
        @RequestParam(required = false) Integer maxExp,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        Long userId = currentUser != null ? resolveId(currentUser) : null;
        return candidateService.searchCandidates(keyword, location, experienceLevel, isOpenToWork, workMode, minExp, maxExp, page, size, userId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get candidate profile by ID")
    public CandidateResponse getCandidate(@PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = currentUser != null ? resolveId(currentUser) : null;
        return candidateService.getCandidateProfile(id, userId);
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my candidate profile")
    public CandidateResponse getMyProfile(@AuthenticationPrincipal UserDetails currentUser) {
        return candidateService.getMyProfile(currentUser.getUsername());
    }

    @PutMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update my candidate profile")
    public CandidateResponse updateMyProfile(
        @RequestBody UpdateCandidateProfileRequest req,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return candidateService.updateProfile(currentUser.getUsername(), req);
    }

    private Long resolveId(UserDetails userDetails) {
        return null; // resolved in service
    }
}
