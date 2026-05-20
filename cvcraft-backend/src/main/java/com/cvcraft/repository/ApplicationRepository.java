package com.cvcraft.repository;

import com.cvcraft.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Optional<Application> findByCandidateIdAndJobPostId(Long candidateId, Long jobPostId);
    boolean existsByCandidateIdAndJobPostId(Long candidateId, Long jobPostId);

    Page<Application> findByCandidateId(Long candidateId, Pageable pageable);
    Page<Application> findByJobPostId(Long jobPostId, Pageable pageable);
    Page<Application> findByJobPostIdAndStatus(Long jobPostId, Application.ApplicationStatus status, Pageable pageable);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.jobPost.id = :jobId")
    long countByJobPostId(@Param("jobId") Long jobId);

    @Query("""
        SELECT a.status, COUNT(a) FROM Application a
        WHERE a.candidate.id = :candidateId
        GROUP BY a.status
    """)
    List<Object[]> countByStatusForCandidate(@Param("candidateId") Long candidateId);

    @Query("""
        SELECT a.status, COUNT(a) FROM Application a
        WHERE a.jobPost.company.id = :companyId
        GROUP BY a.status
    """)
    List<Object[]> countByStatusForCompany(@Param("companyId") Long companyId);
}
