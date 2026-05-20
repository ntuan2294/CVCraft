package com.cvcraft.repository;

import com.cvcraft.entity.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findBySlug(String slug);
    Optional<Company> findByOwnerId(Long ownerId);
    boolean existsBySlug(String slug);
    boolean existsByOwnerId(Long ownerId);

    @Query("""
        SELECT c FROM Company c
        WHERE (:keyword IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:industry IS NULL OR c.industry = :industry)
        AND (:location IS NULL OR LOWER(c.location) LIKE LOWER(CONCAT('%', :location, '%')))
    """)
    Page<Company> searchCompanies(
        @Param("keyword") String keyword,
        @Param("industry") String industry,
        @Param("location") String location,
        Pageable pageable
    );

    @Query("SELECT DISTINCT c.industry FROM Company c WHERE c.industry IS NOT NULL ORDER BY c.industry")
    java.util.List<String> findAllIndustries();
}
