package com.cvcraft.repository;

import com.cvcraft.entity.CvDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CvDocumentRepository extends JpaRepository<CvDocument, Long> {

    Page<CvDocument> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<CvDocument> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
