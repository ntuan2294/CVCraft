package com.cvcraft.controller;

import com.cvcraft.dto.request.ApplyJobRequest;
import com.cvcraft.dto.response.ApplicationResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
@Tag(name = "Applications")
@SecurityRequirement(name = "bearerAuth")
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/jobs/{jobId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Apply to a job (CANDIDATE)")
    public ApplicationResponse apply(
        @PathVariable Long jobId,
        @RequestBody ApplyJobRequest req,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return applicationService.apply(jobId, req, currentUser.getUsername());
    }

    @GetMapping("/my")
    @Operation(summary = "Get my applications")
    public PageResponse<ApplicationResponse> getMyApplications(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return applicationService.getMyApplications(currentUser.getUsername(), page, size);
    }

    @PatchMapping("/{id}/withdraw")
    @Operation(summary = "Withdraw an application")
    public ApplicationResponse withdraw(@PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        return applicationService.withdraw(id, currentUser.getUsername());
    }

    @GetMapping("/jobs/{jobId}")
    @Operation(summary = "Get applications for a job (RECRUITER)")
    public PageResponse<ApplicationResponse> getJobApplications(
        @PathVariable Long jobId,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return applicationService.getJobApplications(jobId, status, currentUser.getUsername(), page, size);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update application status (RECRUITER)")
    public ApplicationResponse updateStatus(
        @PathVariable Long id,
        @RequestParam String status,
        @RequestParam(required = false) String note,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return applicationService.updateStatus(id, status, note, currentUser.getUsername());
    }
}
