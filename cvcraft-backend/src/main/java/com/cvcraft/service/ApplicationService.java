package com.cvcraft.service;

import com.cvcraft.dto.request.ApplyJobRequest;
import com.cvcraft.dto.response.ApplicationResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.entity.Application;
import com.cvcraft.exception.BadRequestException;
import com.cvcraft.exception.ResourceNotFoundException;
import com.cvcraft.repository.ApplicationRepository;
import com.cvcraft.repository.JobPostRepository;
import com.cvcraft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobPostRepository jobPostRepository;
    private final UserRepository userRepository;

    @Transactional
    public ApplicationResponse apply(Long jobId, ApplyJobRequest req, String candidateEmail) {
        var candidate = userRepository.findByEmail(candidateEmail).orElseThrow();
        var job = jobPostRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));

        if (applicationRepository.existsByCandidateIdAndJobPostId(candidate.getId(), jobId)) {
            throw new BadRequestException("You have already applied to this job");
        }

        var app = Application.builder()
            .candidate(candidate)
            .jobPost(job)
            .cvUrl(req.cvUrl())
            .coverLetter(req.coverLetter())
            .status(Application.ApplicationStatus.PENDING)
            .build();

        return ApplicationResponse.from(applicationRepository.save(app));
    }

    @Transactional
    public ApplicationResponse withdraw(Long applicationId, String candidateEmail) {
        var app = getOrThrow(applicationId);
        if (!app.getCandidate().getEmail().equals(candidateEmail)) {
            throw new AccessDeniedException("Not your application");
        }
        app.setStatus(Application.ApplicationStatus.WITHDRAWN);
        return ApplicationResponse.from(applicationRepository.save(app));
    }

    @Transactional
    public ApplicationResponse updateStatus(Long applicationId, String status, String note, String recruiterEmail) {
        var app = getOrThrow(applicationId);
        if (!app.getJobPost().getRecruiter().getEmail().equals(recruiterEmail)) {
            throw new AccessDeniedException("Not your job post");
        }
        app.setStatus(Application.ApplicationStatus.valueOf(status));
        if (note != null) app.setRecruiterNote(note);
        return ApplicationResponse.from(applicationRepository.save(app));
    }

    public PageResponse<ApplicationResponse> getMyApplications(String email, int page, int size) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var pageable = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        return PageResponse.from(
            applicationRepository.findByCandidateId(user.getId(), pageable)
                .map(ApplicationResponse::from)
        );
    }

    public PageResponse<ApplicationResponse> getJobApplications(Long jobId, String status, String recruiterEmail, int page, int size) {
        var job = jobPostRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
        if (!job.getRecruiter().getEmail().equals(recruiterEmail)) {
            throw new AccessDeniedException("Not your job post");
        }
        var pageable = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        var appStatus = status != null ? Application.ApplicationStatus.valueOf(status) : null;
        var result = appStatus != null
            ? applicationRepository.findByJobPostIdAndStatus(jobId, appStatus, pageable)
            : applicationRepository.findByJobPostId(jobId, pageable);
        return PageResponse.from(result.map(ApplicationResponse::from));
    }

    private Application getOrThrow(Long id) {
        return applicationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Application", id));
    }
}
