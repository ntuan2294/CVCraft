package com.cvcraft.repository;

import com.cvcraft.entity.CvTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CvTemplateRepository extends JpaRepository<CvTemplate, Long> {

    @Query("SELECT t FROM CvTemplate t WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(COALESCE(t.description, '')) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<CvTemplate> search(@Param("query") String query, Pageable pageable);
}
