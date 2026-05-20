package com.cvcraft.repository;

import com.cvcraft.entity.JobPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobPostRepository extends JpaRepository<JobPost, Long>, JpaSpecificationExecutor<JobPost> {

    Page<JobPost> findByStatusAndCompanyId(JobPost.JobStatus status, Long companyId, Pageable pageable);
    Page<JobPost> findByRecruiterId(Long recruiterId, Pageable pageable);
    Page<JobPost> findByStatus(JobPost.JobStatus status, Pageable pageable);

    @Query("""
        SELECT j FROM JobPost j
        WHERE j.status = 'OPEN'
        AND (:keyword IS NULL OR LOWER(j.title) LIKE :keyword
             OR LOWER(j.description) LIKE :keyword)
        AND (:location IS NULL OR LOWER(j.location) LIKE :location)
        AND (:category IS NULL OR j.category = :category)
        AND (:jobType IS NULL OR j.jobType = :jobType)
        AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel)
        AND (:workMode IS NULL OR j.workMode = :workMode)
        AND (:salaryMin IS NULL OR j.salaryMax >= :salaryMin)
    """)
    Page<JobPost> searchJobs(
        @Param("keyword") String keyword,
        @Param("location") String location,
        @Param("category") String category,
        @Param("jobType") JobPost.JobType jobType,
        @Param("experienceLevel") JobPost.ExperienceLevel experienceLevel,
        @Param("workMode") JobPost.WorkMode workMode,
        @Param("salaryMin") Long salaryMin,
        Pageable pageable
    );

    @Modifying
    @Query("UPDATE JobPost j SET j.viewCount = j.viewCount + 1 WHERE j.id = :id")
    void incrementViewCount(@Param("id") Long id);

    @Query("SELECT DISTINCT j.category FROM JobPost j WHERE j.status = 'OPEN' AND j.category IS NOT NULL")
    List<String> findAllCategories();

    @Query("SELECT COUNT(j) FROM JobPost j WHERE j.status = 'OPEN'")
    long countOpenJobs();

    @Query("""
        SELECT j FROM JobPost j WHERE j.status = 'OPEN'
        ORDER BY j.viewCount DESC, j.createdAt DESC
    """)
    List<JobPost> findFeaturedJobs(Pageable pageable);
}
