package com.cvcraft.dto.response;

import com.cvcraft.entity.CvTemplate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public record CvTemplateResponse(
    Long id,
    String name,
    String description,
    List<String> fields,
    Boolean supportsPhotoUpload,
    String summaryLabel,
    String thumbnail,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static CvTemplateResponse from(CvTemplate t) {
        List<String> fieldList = Collections.emptyList();
        if (t.getFields() != null && !t.getFields().isBlank()) {
            fieldList = Arrays.stream(t.getFields().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        }
        return new CvTemplateResponse(
            t.getId(),
            t.getName(),
            t.getDescription(),
            fieldList,
            t.getSupportsPhotoUpload() != null ? t.getSupportsPhotoUpload() : false,
            t.getSummaryLabel(),
            t.getThumbnail(),
            t.getCreatedAt(),
            t.getUpdatedAt()
        );
    }
}
