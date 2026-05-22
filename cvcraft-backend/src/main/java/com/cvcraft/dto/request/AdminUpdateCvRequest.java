package com.cvcraft.dto.request;

public record AdminUpdateCvRequest(
    String title,
    String templateId,
    String fileName,
    String downloadUrl,
    Integer atsScore,
    String jdTitle,
    Boolean isPrimary
) {}
