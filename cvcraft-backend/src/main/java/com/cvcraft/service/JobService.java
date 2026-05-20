package com.cvcraft.service;

import com.cvcraft.dto.request.CreateJobRequest;
import com.cvcraft.dto.response.JobPostResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.entity.JobPost;
import com.cvcraft.entity.User;
import com.cvcraft.exception.BadRequestException;
import com.cvcraft.exception.ResourceNotFoundException;
import com.cvcraft.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobPostRepository jobPostRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final BookmarkRepository bookmarkRepository;

    public PageResponse<JobPostResponse> searchJobs(
        String keyword, String location, String category,
        String jobType, String experienceLevel, String workMode,
        Long salaryMin, int page, int size, String sort, Long currentUserId
    ) {
        var pageable = buildPageable(page, size, sort);
        var jobTypeParsed = jobType != null ? JobPost.JobType.valueOf(jobType) : null;
        var expParsed = experienceLevel != null ? JobPost.ExperienceLevel.valueOf(experienceLevel) : null;
        var workModeParsed = workMode != null ? JobPost.WorkMode.valueOf(workMode) : null;

        String keywordLike = keyword != null ? "%" + keyword.toLowerCase() + "%" : null;
        String locationLike = location != null ? "%" + location.toLowerCase() + "%" : null;
        var pageResult = jobPostRepository.searchJobs(
            keywordLike, locationLike, category, jobTypeParsed, expParsed, workModeParsed, salaryMin, pageable
        );
        var responses = pageResult.getContent().stream()
            .map(job -> toResponse(job, currentUserId))
            .toList();
        return PageResponse.from(pageResult.map(j -> responses.get(pageResult.getContent().indexOf(j))));
    }

    @Transactional
    public JobPostResponse createJob(CreateJobRequest req, String recruiterEmail) {
        var recruiter = userRepository.findByEmail(recruiterEmail).orElseThrow();
        var company = companyRepository.findById(req.companyId())
            .orElseThrow(() -> new ResourceNotFoundException("Company", req.companyId()));

        if (!company.getOwner().getId().equals(recruiter.getId())) {
            throw new AccessDeniedException("You don't own this company");
        }

        var job = JobPost.builder()
            .title(req.title())
            .description(req.description())
            .requirements(req.requirements())
            .benefits(req.benefits())
            .location(req.location())
            .jobType(req.jobType())
            .experienceLevel(req.experienceLevel())
            .workMode(req.workMode())
            .salaryMin(req.salaryMin())
            .salaryMax(req.salaryMax())
            .salaryCurrency(req.salaryCurrency() != null ? req.salaryCurrency() : "USD")
            .isSalaryVisible(req.isSalaryVisible() != null ? req.isSalaryVisible() : true)
            .category(req.category())
            .skills(req.skills())
            .deadline(req.deadline())
            .vacancyCount(req.vacancyCount() != null ? req.vacancyCount() : 1)
            .status(JobPost.JobStatus.OPEN)
            .company(company)
            .recruiter(recruiter)
            .build();

        job = jobPostRepository.save(job);
        return toResponse(job, recruiter.getId());
    }

    @Transactional
    public JobPostResponse updateJobStatus(Long jobId, String status, String recruiterEmail) {
        var job = getJobOrThrow(jobId);
        assertOwner(job, recruiterEmail);
        job.setStatus(JobPost.JobStatus.valueOf(status));
        job = jobPostRepository.save(job);
        return toResponse(job, null);
    }

    @Transactional
    public void deleteJob(Long jobId, String recruiterEmail) {
        var job = getJobOrThrow(jobId);
        assertOwner(job, recruiterEmail);
        jobPostRepository.delete(job);
    }

    @Transactional
    public JobPostResponse getJobDetail(Long jobId, Long currentUserId) {
        var job = getJobOrThrow(jobId);
        if (job.getStatus() == JobPost.JobStatus.OPEN) {
            jobPostRepository.incrementViewCount(jobId);
        }
        return toResponse(job, currentUserId);
    }

    public List<JobPostResponse> getFeaturedJobs(int count) {
        return jobPostRepository.findFeaturedJobs(PageRequest.of(0, count))
            .stream().map(j -> toResponse(j, null)).toList();
    }

    public List<String> getAllCategories() {
        return jobPostRepository.findAllCategories();
    }

    public Map<String, Long> getStats() {
        return Map.of(
            "openJobs", jobPostRepository.countOpenJobs(),
            "totalCandidates", userRepository.countActiveCandidates(),
            "totalRecruiters", userRepository.countActiveRecruiters()
        );
    }

    public PageResponse<JobPostResponse> getRecruiterJobs(String email, int page, int size) {
        var recruiter = userRepository.findByEmail(email).orElseThrow();
        var pageable = buildPageable(page, size, "newest");
        return PageResponse.from(
            jobPostRepository.findByRecruiterId(recruiter.getId(), pageable)
                .map(j -> toResponse(j, recruiter.getId()))
        );
    }

    private JobPost getJobOrThrow(Long id) {
        return jobPostRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Job", id));
    }

    private void assertOwner(JobPost job, String recruiterEmail) {
        if (!job.getRecruiter().getEmail().equals(recruiterEmail)) {
            throw new AccessDeniedException("You don't own this job post");
        }
    }

    private JobPostResponse toResponse(JobPost job, Long currentUserId) {
        long appCount = applicationRepository.countByJobPostId(job.getId());
        boolean isBookmarked = currentUserId != null &&
            bookmarkRepository.existsByUserIdAndJobPostId(currentUserId, job.getId());
        boolean hasApplied = currentUserId != null &&
            applicationRepository.existsByCandidateIdAndJobPostId(currentUserId, job.getId());
        return JobPostResponse.from(job, appCount, isBookmarked, hasApplied);
    }

    private Pageable buildPageable(int page, int size, String sort) {
        Sort s = switch (sort != null ? sort : "newest") {
            case "oldest" -> Sort.by("createdAt").ascending();
            case "salary_desc" -> Sort.by("salaryMax").descending();
            case "salary_asc" -> Sort.by("salaryMin").ascending();
            case "popular" -> Sort.by("viewCount").descending();
            default -> Sort.by("createdAt").descending();
        };
        return PageRequest.of(page, size, s);
    }
}
