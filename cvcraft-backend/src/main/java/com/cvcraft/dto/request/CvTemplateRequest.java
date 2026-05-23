package com.cvcraft.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CvTemplateRequest(
    @NotBlank(message = "Name is required")
    String name,
    
    String description,
    
    @NotBlank(message = "Fields are required")
    String fields,
    
    Boolean supportsPhotoUpload,
    
    String summaryLabel,
    
    String thumbnail
) {}
