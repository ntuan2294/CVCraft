package com.cvcraft.dto.request;

import com.cvcraft.entity.JobPost;

import java.util.List;

public record UpdateCandidateProfileRequest(
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
    String linkedinUrl,
    String githubUrl,
    String portfolioUrl,
    Boolean isOpenToWork,
    Boolean isProfileVisible,
    String workExperiences,
    String educations,
    String certifications
) {}
