package com.cvcraft.repository;

import com.cvcraft.entity.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    Optional<Bookmark> findByUserIdAndJobPostId(Long userId, Long jobPostId);
    Optional<Bookmark> findByUserIdAndCandidateId(Long userId, Long candidateId);
    boolean existsByUserIdAndJobPostId(Long userId, Long jobPostId);
    boolean existsByUserIdAndCandidateId(Long userId, Long candidateId);
    Page<Bookmark> findByUserIdAndType(Long userId, Bookmark.BookmarkType type, Pageable pageable);
    void deleteByUserIdAndJobPostId(Long userId, Long jobPostId);
    void deleteByUserIdAndCandidateId(Long userId, Long candidateId);
}
