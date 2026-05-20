package com.cvcraft.dto.request;

import com.cvcraft.entity.JobPost;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreateJobRequest(
    @NotBlank String title,
    @NotBlank String description,
    String requirements,
    String benefits,
    String location,
    @NotNull JobPost.JobType jobType,
    @NotNull JobPost.ExperienceLevel experienceLevel,
    @NotNull JobPost.WorkMode workMode,
    Long salaryMin,
    Long salaryMax,
    String salaryCurrency,
    Boolean isSalaryVisible,
    String category,
    List<String> skills,
    LocalDate deadline,
    Integer vacancyCount,
    @NotNull Long companyId
) {}
