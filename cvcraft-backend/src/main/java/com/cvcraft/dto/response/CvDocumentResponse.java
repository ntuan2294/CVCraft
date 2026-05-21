package com.cvcraft.dto.response;

import com.cvcraft.entity.CvDocument;

import java.time.LocalDateTime;

public record CvDocumentResponse(
    Long id,
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
    public static CvDocumentResponse from(CvDocument doc) {
        return new CvDocumentResponse(
            doc.getId(), doc.getTitle(), doc.getTemplateId(), doc.getFileName(),
            doc.getDownloadUrl(), doc.getAtsScore(), doc.getJdTitle(),
            doc.getIsPrimary(), doc.getCreatedAt(), doc.getUpdatedAt()
        );
    }
}
