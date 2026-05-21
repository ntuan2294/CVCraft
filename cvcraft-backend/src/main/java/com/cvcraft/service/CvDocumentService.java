package com.cvcraft.service;

import com.cvcraft.dto.request.SaveCvRequest;
import com.cvcraft.dto.response.CvDocumentResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.entity.CvDocument;
import com.cvcraft.exception.ResourceNotFoundException;
import com.cvcraft.repository.CvDocumentRepository;
import com.cvcraft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CvDocumentService {

    private final CvDocumentRepository cvDocumentRepository;
    private final UserRepository userRepository;

    public PageResponse<CvDocumentResponse> getMyCvs(String email, int page, int size) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var pageable = PageRequest.of(page, size);
        return PageResponse.from(
            cvDocumentRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(CvDocumentResponse::from)
        );
    }

    @Transactional
    public CvDocumentResponse saveCv(String email, SaveCvRequest req) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var doc = CvDocument.builder()
            .user(user)
            .title(req.title() != null ? req.title() : "My CV")
            .templateId(req.templateId())
            .fileName(req.fileName())
            .downloadUrl(req.downloadUrl())
            .atsScore(req.atsScore())
            .jdTitle(req.jdTitle())
            .jdText(req.jdText())
            .build();
        return CvDocumentResponse.from(cvDocumentRepository.save(doc));
    }

    @Transactional
    public CvDocumentResponse setPrimary(String email, Long docId) {
        var user = userRepository.findByEmail(email).orElseThrow();
        // clear any existing primary
        cvDocumentRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 100))
            .forEach(d -> { d.setIsPrimary(false); cvDocumentRepository.save(d); });
        var doc = cvDocumentRepository.findByIdAndUserId(docId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("CvDocument", docId));
        doc.setIsPrimary(true);
        return CvDocumentResponse.from(cvDocumentRepository.save(doc));
    }

    @Transactional
    public void deleteCv(String email, Long docId) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var doc = cvDocumentRepository.findByIdAndUserId(docId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("CvDocument", docId));
        cvDocumentRepository.delete(doc);
    }

    public long countMyCvs(String email) {
        var user = userRepository.findByEmail(email).orElseThrow();
        return cvDocumentRepository.countByUserId(user.getId());
    }
}
