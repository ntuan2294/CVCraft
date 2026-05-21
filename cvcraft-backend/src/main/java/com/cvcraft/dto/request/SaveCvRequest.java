package com.cvcraft.dto.request;

public record SaveCvRequest(
    String title,
    String templateId,
    String fileName,
    String downloadUrl,
    Integer atsScore,
    String jdTitle,
    String jdText
) {}
