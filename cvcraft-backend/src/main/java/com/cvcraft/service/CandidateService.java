package com.cvcraft.service;

import com.cvcraft.dto.request.UpdateCandidateProfileRequest;
import com.cvcraft.dto.response.CandidateResponse;
import com.cvcraft.entity.CandidateProfile;
import com.cvcraft.repository.CandidateProfileRepository;
import com.cvcraft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateProfileRepository candidateProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public CandidateResponse getMyProfile(String email) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var profile = candidateProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                var p = CandidateProfile.builder().user(user).build();
                return candidateProfileRepository.save(p);
            });
        return CandidateResponse.from(profile);
    }

    @Transactional
    public CandidateResponse updateProfile(String email, UpdateCandidateProfileRequest req) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var profile = candidateProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> CandidateProfile.builder().user(user).build());

        if (req.fullName() != null) user.setFullName(req.fullName());
        if (req.phone() != null) user.setPhone(req.phone());
        userRepository.save(user);

        if (req.headline() != null) profile.setHeadline(req.headline());
        if (req.bio() != null) profile.setBio(req.bio());
        if (req.location() != null) profile.setLocation(req.location());
        if (req.experienceYears() != null) profile.setExperienceYears(req.experienceYears());
        if (req.experienceLevel() != null) profile.setExperienceLevel(req.experienceLevel());
        if (req.skills() != null) profile.setSkills(req.skills());
        if (req.linkedinUrl() != null) profile.setLinkedinUrl(req.linkedinUrl());
        if (req.githubUrl() != null) profile.setGithubUrl(req.githubUrl());
        if (req.portfolioUrl() != null) profile.setPortfolioUrl(req.portfolioUrl());
        if (req.workExperiences() != null) profile.setWorkExperiences(req.workExperiences());
        if (req.educations() != null) profile.setEducations(req.educations());
        if (req.certifications() != null) profile.setCertifications(req.certifications());
        if (req.languages() != null) profile.setLanguages(req.languages());
        if (req.projects() != null) profile.setProjects(req.projects());
        if (req.referencesInfo() != null) profile.setReferencesInfo(req.referencesInfo());

        profile = candidateProfileRepository.save(profile);
        return CandidateResponse.from(profile);
    }
}
