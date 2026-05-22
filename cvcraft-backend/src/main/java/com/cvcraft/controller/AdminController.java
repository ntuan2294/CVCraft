package com.cvcraft.controller;

import com.cvcraft.dto.request.AdminCreateUserRequest;
import com.cvcraft.dto.request.AdminUpdateCvRequest;
import com.cvcraft.dto.request.AdminUpdateUserRequest;
import com.cvcraft.dto.response.AdminCvDocumentResponse;
import com.cvcraft.dto.response.AdminDashboardResponse;
import com.cvcraft.dto.response.AdminUserResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard stats")
    public AdminDashboardResponse getDashboardStats() {
        return adminService.getDashboardStats();
    }

    @GetMapping("/users")
    @Operation(summary = "List users for admin")
    public PageResponse<AdminUserResponse> getUsers(
        @RequestParam(defaultValue = "") String query,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.getUsers(query, page, size);
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create user as admin")
    public AdminUserResponse createUser(@Valid @RequestBody AdminCreateUserRequest req) {
        return adminService.createUser(req);
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Update user as admin")
    public AdminUserResponse updateUser(
        @PathVariable Long id,
        @Valid @RequestBody AdminUpdateUserRequest req,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        return adminService.updateUser(currentUser.getUsername(), id, req);
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete user as admin")
    public void deleteUser(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails currentUser
    ) {
        adminService.deleteUser(currentUser.getUsername(), id);
    }

    @GetMapping("/cv-docs")
    @Operation(summary = "List all CV documents for admin")
    public PageResponse<AdminCvDocumentResponse> getCvDocuments(
        @RequestParam(defaultValue = "") String query,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.getCvDocuments(query, page, size);
    }

    @PutMapping("/cv-docs/{id}")
    @Operation(summary = "Update CV document as admin")
    public AdminCvDocumentResponse updateCvDocument(
        @PathVariable Long id,
        @RequestBody AdminUpdateCvRequest req
    ) {
        return adminService.updateCvDocument(id, req);
    }

    @DeleteMapping("/cv-docs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete CV document as admin")
    public void deleteCvDocument(@PathVariable Long id) {
        adminService.deleteCvDocument(id);
    }
}
