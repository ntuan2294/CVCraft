package com.cvcraft.controller;

import com.cvcraft.dto.response.CvTemplateResponse;
import com.cvcraft.service.CvTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/cv-templates")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "CV Templates")
public class CvTemplateController {

    private final CvTemplateService cvTemplateService;

    @GetMapping
    @Operation(summary = "List all CV templates")
    public List<CvTemplateResponse> getAllTemplates() {
        return cvTemplateService.getAllTemplates();
    }
}
