package com.cvcraft.controller;

import com.cvcraft.dto.request.SaveCvRequest;
import com.cvcraft.dto.response.CvDocumentResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.service.CvDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/cv-docs")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "CV Library")
public class CvDocumentController {

    private final CvDocumentService cvDocumentService;

    @GetMapping
    @Operation(summary = "List my saved CVs")
    public PageResponse<CvDocumentResponse> getMyCvs(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return cvDocumentService.getMyCvs(currentUser.getUsername(), page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Save a generated CV to library")
    public CvDocumentResponse saveCv(
        @RequestBody SaveCvRequest req,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return cvDocumentService.saveCv(currentUser.getUsername(), req);
    }

    @PatchMapping("/{id}/primary")
    @Operation(summary = "Mark a CV as primary")
    public CvDocumentResponse setPrimary(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return cvDocumentService.setPrimary(currentUser.getUsername(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a CV from library")
    public void deleteCv(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        cvDocumentService.deleteCv(currentUser.getUsername(), id);
    }

    @GetMapping("/stats")
    @Operation(summary = "Get CV library stats")
    public Map<String, Long> getStats(@AuthenticationPrincipal UserDetails currentUser) {
        return Map.of("totalCvs", cvDocumentService.countMyCvs(currentUser.getUsername()));
    }
}
