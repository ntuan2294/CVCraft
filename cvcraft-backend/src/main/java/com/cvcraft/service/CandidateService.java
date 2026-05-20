package com.cvcraft.service;

import com.cvcraft.dto.request.UpdateCandidateProfileRequest;
import com.cvcraft.dto.response.CandidateResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.entity.CandidateProfile;
import com.cvcraft.entity.JobPost;
import com.cvcraft.exception.ResourceNotFoundException;
import com.cvcraft.repository.BookmarkRepository;
import com.cvcraft.repository.CandidateProfileRepository;
import com.cvcraft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateProfileRepository candidateProfileRepository;
    private final UserRepository userRepository;
    private final BookmarkRepository bookmarkRepository;

    public PageResponse<CandidateResponse> searchCandidates(
        String keyword, String location, String experienceLevel,
        Boolean isOpenToWork, String workMode, Integer minExp, Integer maxExp,
        int page, int size, Long currentUserId
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var expParsed = experienceLevel != null ? JobPost.ExperienceLevel.valueOf(experienceLevel) : null;
        var workModeParsed = workMode != null ? JobPost.WorkMode.valueOf(workMode) : null;

        String keywordLike = keyword != null ? "%" + keyword.toLowerCase() + "%" : null;
        String locationLike = location != null ? "%" + location.toLowerCase() + "%" : null;
        return PageResponse.from(
            candidateProfileRepository.searchCandidates(
                keywordLike, locationLike, expParsed, isOpenToWork, workModeParsed, minExp, maxExp, pageable
            ).map(p -> toResponse(p, currentUserId))
        );
    }

    @Transactional
    public CandidateResponse getCandidateProfile(Long profileId, Long currentUserId) {
        var profile = candidateProfileRepository.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("CandidateProfile", profileId));
        candidateProfileRepository.incrementProfileViews(profileId);
        return toResponse(profile, currentUserId);
    }

    @Transactional
    public CandidateResponse getMyProfile(String email) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var profile = candidateProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                var p = CandidateProfile.builder().user(user).build();
                return candidateProfileRepository.save(p);
            });
        return toResponse(profile, user.getId());
    }

    @Transactional
    public CandidateResponse updateProfile(String email, UpdateCandidateProfileRequest req) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var profile = candidateProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> CandidateProfile.builder().user(user).build());

        if (req.headline() != null) profile.setHeadline(req.headline());
        if (req.bio() != null) profile.setBio(req.bio());
        if (req.location() != null) profile.setLocation(req.location());
        if (req.experienceYears() != null) profile.setExperienceYears(req.experienceYears());
        if (req.experienceLevel() != null) profile.setExperienceLevel(req.experienceLevel());
        if (req.skills() != null) profile.setSkills(req.skills());
        if (req.desiredSalaryMin() != null) profile.setDesiredSalaryMin(req.desiredSalaryMin());
        if (req.desiredSalaryMax() != null) profile.setDesiredSalaryMax(req.desiredSalaryMax());
        if (req.desiredJobTypes() != null) profile.setDesiredJobTypes(req.desiredJobTypes());
        if (req.desiredWorkMode() != null) profile.setDesiredWorkMode(req.desiredWorkMode());
        if (req.linkedinUrl() != null) profile.setLinkedinUrl(req.linkedinUrl());
        if (req.githubUrl() != null) profile.setGithubUrl(req.githubUrl());
        if (req.portfolioUrl() != null) profile.setPortfolioUrl(req.portfolioUrl());
        if (req.isOpenToWork() != null) profile.setIsOpenToWork(req.isOpenToWork());
        if (req.isProfileVisible() != null) profile.setIsProfileVisible(req.isProfileVisible());
        if (req.workExperiences() != null) profile.setWorkExperiences(req.workExperiences());
        if (req.educations() != null) profile.setEducations(req.educations());
        if (req.certifications() != null) profile.setCertifications(req.certifications());

        profile = candidateProfileRepository.save(profile);
        return toResponse(profile, user.getId());
    }

    private CandidateResponse toResponse(CandidateProfile profile, Long currentUserId) {
        boolean isBookmarked = currentUserId != null &&
            bookmarkRepository.existsByUserIdAndCandidateId(currentUserId, profile.getUser().getId());
        return CandidateResponse.from(profile, isBookmarked);
    }
}
