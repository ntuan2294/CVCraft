package com.cvcraft.repository;

import com.cvcraft.entity.CandidateProfile;
import com.cvcraft.entity.JobPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, Long> {

    Optional<CandidateProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);

    @Query("""
        SELECT p FROM CandidateProfile p
        WHERE p.isProfileVisible = true
        AND (:keyword IS NULL OR LOWER(p.headline) LIKE :keyword
             OR LOWER(p.bio) LIKE :keyword)
        AND (:location IS NULL OR LOWER(p.location) LIKE :location)
        AND (:experienceLevel IS NULL OR p.experienceLevel = :experienceLevel)
        AND (:isOpenToWork IS NULL OR p.isOpenToWork = :isOpenToWork)
        AND (:workMode IS NULL OR p.desiredWorkMode = :workMode)
        AND (:minExp IS NULL OR p.experienceYears >= :minExp)
        AND (:maxExp IS NULL OR p.experienceYears <= :maxExp)
    """)
    Page<CandidateProfile> searchCandidates(
        @Param("keyword") String keyword,
        @Param("location") String location,
        @Param("experienceLevel") JobPost.ExperienceLevel experienceLevel,
        @Param("isOpenToWork") Boolean isOpenToWork,
        @Param("workMode") JobPost.WorkMode workMode,
        @Param("minExp") Integer minExp,
        @Param("maxExp") Integer maxExp,
        Pageable pageable
    );

    @Modifying
    @Query("UPDATE CandidateProfile p SET p.profileViews = p.profileViews + 1 WHERE p.id = :id")
    void incrementProfileViews(@Param("id") Long id);
}
