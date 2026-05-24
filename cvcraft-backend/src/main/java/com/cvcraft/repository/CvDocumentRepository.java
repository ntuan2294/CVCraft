package com.cvcraft.repository;

import com.cvcraft.entity.CvDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface CvDocumentRepository extends JpaRepository<CvDocument, Long> {

    Page<CvDocument> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<CvDocument> findByIdAndUserId(Long id, Long userId);
    Page<CvDocument> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByUserId(Long userId);
    long countByCreatedAtAfter(LocalDateTime createdAt);
    boolean existsByTemplateId(String templateId);

    @Query("""
        SELECT c FROM CvDocument c
        JOIN c.user u
        WHERE (:query = '' OR
               lower(c.title) LIKE lower(concat('%', :query, '%')) OR
               lower(coalesce(c.jdTitle, '')) LIKE lower(concat('%', :query, '%')) OR
               lower(u.email) LIKE lower(concat('%', :query, '%')) OR
               lower(u.fullName) LIKE lower(concat('%', :query, '%')))
        ORDER BY c.createdAt DESC
    """)
    Page<CvDocument> searchForAdmin(@Param("query") String query, Pageable pageable);
}
