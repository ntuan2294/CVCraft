package com.cvcraft.dto.request;

import com.cvcraft.entity.CandidateProfile;

import java.util.List;

public record UpdateCandidateProfileRequest(
    String fullName,
    String phone,
    String headline,
    String bio,
    String location,
    Integer experienceYears,
    CandidateProfile.ExperienceLevel experienceLevel,
    List<String> skills,
    String linkedinUrl,
    String githubUrl,
    String portfolioUrl,
    String workExperiences,
    String educations,
    String certifications,
    String languages,
    String projects,
    String referencesInfo
) {}
