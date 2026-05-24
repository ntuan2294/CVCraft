package com.cvcraft.service;

import com.cvcraft.dto.request.CvTemplateRequest;
import com.cvcraft.dto.response.CvTemplateResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.entity.CvTemplate;
import com.cvcraft.exception.ResourceNotFoundException;
import com.cvcraft.repository.CvTemplateRepository;
import com.cvcraft.repository.CvDocumentRepository;
import com.cvcraft.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CvTemplateService {

    private final CvTemplateRepository cvTemplateRepository;
    private final CvDocumentRepository cvDocumentRepository;

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
    public void deleteTemplate(Long id) {
        var template = cvTemplateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CvTemplate", id));
        
        if (cvDocumentRepository.existsByTemplateId(String.valueOf(id))) {
            throw new BadRequestException("Cannot delete template because it is currently in use by CV documents");
        }
        
        cvTemplateRepository.delete(template);
    }
}
