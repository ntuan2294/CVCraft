package com.cvcraft.controller;

import com.cvcraft.dto.request.CreateJobRequest;
import com.cvcraft.dto.response.JobPostResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs")
public class JobController {

    private final JobService jobService;

    @GetMapping
    @Operation(summary = "Search and filter job posts")
    public PageResponse<JobPostResponse> searchJobs(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String jobType,
        @RequestParam(required = false) String experienceLevel,
        @RequestParam(required = false) String workMode,
        @RequestParam(required = false) Long salaryMin,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size,
        @RequestParam(defaultValue = "newest") String sort,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        Long userId = resolveUserId(currentUser);
        return jobService.searchJobs(keyword, location, category, jobType, experienceLevel, workMode, salaryMin, page, size, sort, userId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get job detail by ID")
    public JobPostResponse getJob(@PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = resolveUserId(currentUser);
        return jobService.getJobDetail(id, userId);
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured / hot jobs")
    public List<JobPostResponse> getFeaturedJobs(@RequestParam(defaultValue = "6") int count) {
        return jobService.getFeaturedJobs(count);
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all job categories")
    public List<String> getCategories() {
        return jobService.getAllCategories();
    }

    @GetMapping("/stats")
    @Operation(summary = "Platform statistics")
    public Map<String, Long> getStats() {
        return jobService.getStats();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new job post (RECRUITER only)")
    public JobPostResponse createJob(
        @Valid @RequestBody CreateJobRequest req,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return jobService.createJob(req, currentUser.getUsername());
    }

    @PatchMapping("/{id}/status")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update job status (OPEN/PAUSED/CLOSED)")
    public JobPostResponse updateStatus(
        @PathVariable Long id,
        @RequestParam String status,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return jobService.updateJobStatus(id, status, currentUser.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a job post")
    public void deleteJob(@PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        jobService.deleteJob(id, currentUser.getUsername());
    }

    @GetMapping("/my")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get recruiter's own job posts")
    public PageResponse<JobPostResponse> getMyJobs(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return jobService.getRecruiterJobs(currentUser.getUsername(), page, size);
    }

    private Long resolveUserId(UserDetails userDetails) {
        return null; // Resolved in service via email lookup when needed
    }
}
