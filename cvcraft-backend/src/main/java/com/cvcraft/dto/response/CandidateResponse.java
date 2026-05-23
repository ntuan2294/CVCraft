package com.cvcraft.dto.response;

import com.cvcraft.entity.CandidateProfile;

import java.time.LocalDateTime;
import java.util.List;

public record CandidateResponse(
    Long id,
    Long userId,
    String fullName,
    String email,
    String phone,
    String avatarUrl,
    String headline,
    String bio,
    String location,
    Integer experienceYears,
    CandidateProfile.ExperienceLevel experienceLevel,
    List<String> skills,
    String cvUrl,
    String linkedinUrl,
    String githubUrl,
    String portfolioUrl,
    String workExperiences,
    String educations,
    String certifications,
    String languages,
    String projects,
    String referencesInfo,
    LocalDateTime createdAt
) {
    public static CandidateResponse from(CandidateProfile p) {
        return new CandidateResponse(
            p.getId(), p.getUser().getId(), p.getUser().getFullName(), p.getUser().getEmail(),
            p.getUser().getPhone(), p.getUser().getAvatarUrl(), p.getHeadline(), p.getBio(), p.getLocation(),
            p.getExperienceYears(), p.getExperienceLevel(), p.getSkills(),
            p.getCvUrl(), p.getLinkedinUrl(), p.getGithubUrl(), p.getPortfolioUrl(),
            p.getWorkExperiences(), p.getEducations(), p.getCertifications(),
            p.getLanguages(), p.getProjects(), p.getReferencesInfo(),
            p.getCreatedAt()
        );
    }
}
