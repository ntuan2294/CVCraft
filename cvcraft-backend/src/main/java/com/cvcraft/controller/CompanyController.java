package com.cvcraft.controller;

import com.cvcraft.entity.Company;
import com.cvcraft.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/companies")
@RequiredArgsConstructor
@Tag(name = "Companies")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @Operation(summary = "Search companies")
    public Page<Company> search(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String industry,
        @RequestParam(required = false) String location,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return companyService.search(keyword, industry, location, page, size);
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get company by slug")
    public Company getBySlug(@PathVariable String slug) {
        return companyService.getBySlug(slug);
    }

    @GetMapping("/industries")
    @Operation(summary = "Get all company industries")
    public List<String> getIndustries() {
        return companyService.getAllIndustries();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a company (RECRUITER)")
    public Company create(@RequestBody Company company, @AuthenticationPrincipal UserDetails currentUser) {
        return companyService.createCompany(company, currentUser.getUsername());
    }
}
