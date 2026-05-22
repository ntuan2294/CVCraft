package com.cvcraft.dto.response;

import com.cvcraft.entity.CvDocument;

import java.time.LocalDateTime;

public record AdminCvDocumentResponse(
    Long id,
    Long userId,
    String userEmail,
    String userFullName,
    String title,
    String templateId,
    String fileName,
    String downloadUrl,
    Integer atsScore,
    String jdTitle,
    Boolean isPrimary,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static AdminCvDocumentResponse from(CvDocument doc) {
        return new AdminCvDocumentResponse(
            doc.getId(),
            doc.getUser().getId(),
            doc.getUser().getEmail(),
            doc.getUser().getFullName(),
            doc.getTitle(),
            doc.getTemplateId(),
            doc.getFileName(),
            doc.getDownloadUrl(),
            doc.getAtsScore(),
            doc.getJdTitle(),
            doc.getIsPrimary(),
            doc.getCreatedAt(),
            doc.getUpdatedAt()
        );
    }
}
