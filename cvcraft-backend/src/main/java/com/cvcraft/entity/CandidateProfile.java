package com.cvcraft.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "candidate_profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CandidateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(length = 200)
    private String headline;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 100)
    private String location;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level")
    private JobPost.ExperienceLevel experienceLevel;

    @ElementCollection
    @CollectionTable(name = "candidate_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "skill")
    private List<String> skills;

    @Column(name = "desired_salary_min")
    private Long desiredSalaryMin;

    @Column(name = "desired_salary_max")
    private Long desiredSalaryMax;

    @Column(name = "desired_job_types")
    private String desiredJobTypes;

    @Column(name = "desired_work_mode")
    @Enumerated(EnumType.STRING)
    private JobPost.WorkMode desiredWorkMode;

    @Column(name = "cv_url")
    private String cvUrl;

    @Column(name = "linkedin_url", length = 200)
    private String linkedinUrl;

    @Column(name = "github_url", length = 200)
    private String githubUrl;

    @Column(name = "portfolio_url", length = 200)
    private String portfolioUrl;

    @Column(name = "is_open_to_work")
    @Builder.Default
    private Boolean isOpenToWork = true;

    @Column(name = "is_profile_visible")
    @Builder.Default
    private Boolean isProfileVisible = true;

    @Column(name = "profile_views")
    @Builder.Default
    private Long profileViews = 0L;

    @Column(columnDefinition = "jsonb")
    private String workExperiences;

    @Column(columnDefinition = "jsonb")
    private String educations;

    @Column(columnDefinition = "jsonb")
    private String certifications;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
