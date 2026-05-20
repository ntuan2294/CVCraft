package com.cvcraft.dto.response;

import com.cvcraft.entity.CandidateProfile;
import com.cvcraft.entity.JobPost;

import java.time.LocalDateTime;
import java.util.List;

public record CandidateResponse(
    Long id,
    Long userId,
    String fullName,
    String email,
    String avatarUrl,
    String headline,
    String bio,
    String location,
    Integer experienceYears,
    JobPost.ExperienceLevel experienceLevel,
    List<String> skills,
    Long desiredSalaryMin,
    Long desiredSalaryMax,
    String desiredJobTypes,
    JobPost.WorkMode desiredWorkMode,
    String cvUrl,
    String linkedinUrl,
    String githubUrl,
    String portfolioUrl,
    Boolean isOpenToWork,
    Long profileViews,
    String workExperiences,
    String educations,
    String certifications,
    LocalDateTime createdAt,
    boolean isBookmarked
) {
    public static CandidateResponse from(CandidateProfile p, boolean isBookmarked) {
        return new CandidateResponse(
            p.getId(), p.getUser().getId(), p.getUser().getFullName(), p.getUser().getEmail(),
            p.getUser().getAvatarUrl(), p.getHeadline(), p.getBio(), p.getLocation(),
            p.getExperienceYears(), p.getExperienceLevel(), p.getSkills(),
            p.getDesiredSalaryMin(), p.getDesiredSalaryMax(), p.getDesiredJobTypes(), p.getDesiredWorkMode(),
            p.getCvUrl(), p.getLinkedinUrl(), p.getGithubUrl(), p.getPortfolioUrl(),
            p.getIsOpenToWork(), p.getProfileViews(), p.getWorkExperiences(), p.getEducations(),
            p.getCertifications(), p.getCreatedAt(), isBookmarked
        );
    }
}
