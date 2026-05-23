package com.cvcraft.service;

import com.cvcraft.dto.request.CvTemplateRequest;
import com.cvcraft.dto.response.CvTemplateResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.entity.CvTemplate;
import com.cvcraft.exception.ResourceNotFoundException;
import com.cvcraft.repository.CvTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CvTemplateService {

    private final CvTemplateRepository cvTemplateRepository;

    @Transactional(readOnly = true)
    public List<CvTemplateResponse> getAllTemplates() {
        return cvTemplateRepository.findAll().stream()
            .map(CvTemplateResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<CvTemplateResponse> searchTemplates(String query, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var normalizedQuery = query == null ? "" : query.trim();
        return PageResponse.from(
            cvTemplateRepository.search(normalizedQuery, pageable)
                .map(CvTemplateResponse::from)
        );
    }

    @Transactional
    public CvTemplateResponse createTemplate(CvTemplateRequest req) {
        var template = CvTemplate.builder()
            .name(req.name().trim())
            .description(req.description())
            .fields(req.fields().trim())
            .supportsPhotoUpload(req.supportsPhotoUpload() != null ? req.supportsPhotoUpload() : false)
            .summaryLabel(req.summaryLabel())
            .thumbnail(req.thumbnail())
            .build();
        template = cvTemplateRepository.save(template);
        return CvTemplateResponse.from(template);
    }

    @Transactional
    public CvTemplateResponse updateTemplate(Long id, CvTemplateRequest req) {
        var template = cvTemplateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CvTemplate", id));
        
        template.setName(req.name().trim());
        template.setDescription(req.description());
        template.setFields(req.fields().trim());
        template.setSupportsPhotoUpload(req.supportsPhotoUpload() != null ? req.supportsPhotoUpload() : false);
        template.setSummaryLabel(req.summaryLabel());
        template.setThumbnail(req.thumbnail());

        template = cvTemplateRepository.save(template);
        return CvTemplateResponse.from(template);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        var template = cvTemplateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CvTemplate", id));
        cvTemplateRepository.delete(template);
    }
}
