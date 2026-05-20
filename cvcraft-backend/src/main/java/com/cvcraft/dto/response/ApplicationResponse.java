package com.cvcraft.dto.response;

import com.cvcraft.entity.Application;

import java.time.LocalDateTime;

public record ApplicationResponse(
    Long id,
    JobSummary job,
    CandidateSummary candidate,
    String cvUrl,
    String coverLetter,
    Application.ApplicationStatus status,
    String recruiterNote,
    String rejectionReason,
    LocalDateTime interviewDate,
    LocalDateTime appliedAt,
    LocalDateTime updatedAt
) {
    public record JobSummary(Long id, String title, String location, String companyName, String companyLogo) {}
    public record CandidateSummary(Long id, String fullName, String email, String avatarUrl, String headline) {}

    public static ApplicationResponse from(Application a) {
        var job = a.getJobPost();
        var candidate = a.getCandidate();
        var profile = candidate.getCandidateProfile();
        return new ApplicationResponse(
            a.getId(),
            new JobSummary(job.getId(), job.getTitle(), job.getLocation(),
                job.getCompany().getName(), job.getCompany().getLogoUrl()),
            new CandidateSummary(candidate.getId(), candidate.getFullName(), candidate.getEmail(),
                candidate.getAvatarUrl(), profile != null ? profile.getHeadline() : null),
            a.getCvUrl(), a.getCoverLetter(), a.getStatus(),
            a.getRecruiterNote(), a.getRejectionReason(), a.getInterviewDate(),
            a.getAppliedAt(), a.getUpdatedAt()
        );
    }
}
