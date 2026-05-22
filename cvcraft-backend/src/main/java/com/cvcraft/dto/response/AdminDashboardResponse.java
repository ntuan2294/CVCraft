package com.cvcraft.dto.response;

public record AdminDashboardResponse(
    long totalUsers,
    long totalCandidates,
    long totalAdmins,
    long activeUsers,
    long inactiveUsers,
    long totalCvDocuments,
    long cvsCreatedLast7Days
) {}
