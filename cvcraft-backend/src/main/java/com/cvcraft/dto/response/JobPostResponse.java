package com.cvcraft.dto.response;

import com.cvcraft.entity.JobPost;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record JobPostResponse(
    Long id,
    String title,
    String description,
    String requirements,
    String benefits,
    String location,
    JobPost.JobType jobType,
    JobPost.ExperienceLevel experienceLevel,
    JobPost.WorkMode workMode,
    Long salaryMin,
    Long salaryMax,
    String salaryCurrency,
    Boolean isSalaryVisible,
    String category,
    List<String> skills,
    LocalDate deadline,
    Integer vacancyCount,
    JobPost.JobStatus status,
    Long viewCount,
    Long applicationCount,
    CompanySummary company,
    RecruiterSummary recruiter,
    LocalDateTime createdAt,
    boolean isBookmarked,
    boolean hasApplied
) {
    public record CompanySummary(Long id, String name, String slug, String logoUrl, String location, Boolean isVerified) {}
    public record RecruiterSummary(Long id, String fullName, String avatarUrl) {}

    public static JobPostResponse from(JobPost job, long applicationCount, boolean isBookmarked, boolean hasApplied) {
        return new JobPostResponse(
            job.getId(), job.getTitle(), job.getDescription(), job.getRequirements(), job.getBenefits(),
            job.getLocation(), job.getJobType(), job.getExperienceLevel(), job.getWorkMode(),
            job.getSalaryMin(), job.getSalaryMax(), job.getSalaryCurrency(), job.getIsSalaryVisible(),
            job.getCategory(), job.getSkills(), job.getDeadline(), job.getVacancyCount(),
            job.getStatus(), job.getViewCount(), applicationCount,
            new CompanySummary(
                job.getCompany().getId(), job.getCompany().getName(), job.getCompany().getSlug(),
                job.getCompany().getLogoUrl(), job.getCompany().getLocation(), job.getCompany().getIsVerified()
            ),
            new RecruiterSummary(job.getRecruiter().getId(), job.getRecruiter().getFullName(), job.getRecruiter().getAvatarUrl()),
            job.getCreatedAt(), isBookmarked, hasApplied
        );
    }
}
