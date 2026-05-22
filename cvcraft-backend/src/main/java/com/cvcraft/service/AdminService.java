package com.cvcraft.service;

import com.cvcraft.dto.request.AdminCreateUserRequest;
import com.cvcraft.dto.request.AdminUpdateCvRequest;
import com.cvcraft.dto.request.AdminUpdateUserRequest;
import com.cvcraft.dto.response.AdminCvDocumentResponse;
import com.cvcraft.dto.response.AdminDashboardResponse;
import com.cvcraft.dto.response.AdminUserResponse;
import com.cvcraft.dto.response.PageResponse;
import com.cvcraft.entity.User;
import com.cvcraft.exception.BadRequestException;
import com.cvcraft.exception.ResourceNotFoundException;
import com.cvcraft.repository.CvDocumentRepository;
import com.cvcraft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final CvDocumentRepository cvDocumentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalCandidates = userRepository.countByRole(User.Role.CANDIDATE);
        long totalAdmins = userRepository.countByRole(User.Role.ADMIN);
        long activeUsers = userRepository.countByIsActive(true);
        long inactiveUsers = userRepository.countByIsActive(false);
        long totalCvDocuments = cvDocumentRepository.count();
        long cvsCreatedLast7Days = cvDocumentRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7));

        return new AdminDashboardResponse(
            totalUsers,
            totalCandidates,
            totalAdmins,
            activeUsers,
            inactiveUsers,
            totalCvDocuments,
            cvsCreatedLast7Days
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> getUsers(String query, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var normalizedQuery = query == null ? "" : query.trim();
        return PageResponse.from(
            userRepository.searchForAdmin(normalizedQuery, pageable)
                .map(user -> AdminUserResponse.from(user, cvDocumentRepository.countByUserId(user.getId())))
        );
    }

    @Transactional
    public AdminUserResponse createUser(AdminCreateUserRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BadRequestException("Email already registered: " + req.email());
        }

        var user = User.builder()
            .email(req.email().trim())
            .password(passwordEncoder.encode(req.password()))
            .fullName(req.fullName().trim())
            .phone(req.phone())
            .role(req.role())
            .isActive(req.isActive() != null ? req.isActive() : true)
            .isEmailVerified(req.isEmailVerified() != null ? req.isEmailVerified() : false)
            .build();

        user = userRepository.save(user);
        return AdminUserResponse.from(user, 0);
    }

    @Transactional
    public AdminUserResponse updateUser(String currentAdminEmail, Long userId, AdminUpdateUserRequest req) {
        var user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        var normalizedEmail = req.email().trim();
        if (!user.getEmail().equalsIgnoreCase(normalizedEmail) && userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email already registered: " + normalizedEmail);
        }

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            if (req.role() != User.Role.ADMIN) {
                throw new BadRequestException("You cannot remove your own admin role");
            }
            if (!req.isActive()) {
                throw new BadRequestException("You cannot deactivate your own account");
            }
        }

        user.setEmail(normalizedEmail);
        user.setFullName(req.fullName().trim());
        user.setPhone(req.phone());
        user.setRole(req.role());
        user.setIsActive(req.isActive());
        user.setIsEmailVerified(req.isEmailVerified());
        if (req.password() != null && !req.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.password()));
        }

        user = userRepository.save(user);
        return AdminUserResponse.from(user, cvDocumentRepository.countByUserId(user.getId()));
    }

    @Transactional
    public void deleteUser(String currentAdminEmail, Long userId) {
        var user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new BadRequestException("You cannot delete your own account");
        }

        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminCvDocumentResponse> getCvDocuments(String query, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var normalizedQuery = query == null ? "" : query.trim();
        return PageResponse.from(
            cvDocumentRepository.searchForAdmin(normalizedQuery, pageable)
                .map(AdminCvDocumentResponse::from)
        );
    }

    @Transactional
    public AdminCvDocumentResponse updateCvDocument(Long cvId, AdminUpdateCvRequest req) {
        var doc = cvDocumentRepository.findById(cvId)
            .orElseThrow(() -> new ResourceNotFoundException("CvDocument", cvId));

        if (req.title() != null) doc.setTitle(req.title());
        if (req.templateId() != null) doc.setTemplateId(req.templateId());
        if (req.fileName() != null) doc.setFileName(req.fileName());
        if (req.downloadUrl() != null) doc.setDownloadUrl(req.downloadUrl());
        if (req.atsScore() != null) doc.setAtsScore(req.atsScore());
        if (req.jdTitle() != null) doc.setJdTitle(req.jdTitle());
        if (req.isPrimary() != null) {
            if (req.isPrimary()) {
                Long selectedDocId = doc.getId();
                cvDocumentRepository.findByUserIdOrderByCreatedAtDesc(doc.getUser().getId(), PageRequest.of(0, 200))
                    .forEach(item -> item.setIsPrimary(item.getId().equals(selectedDocId)));
            } else {
                doc.setIsPrimary(false);
            }
        }

        doc = cvDocumentRepository.save(doc);
        return AdminCvDocumentResponse.from(doc);
    }

    @Transactional
    public void deleteCvDocument(Long cvId) {
        var doc = cvDocumentRepository.findById(cvId)
            .orElseThrow(() -> new ResourceNotFoundException("CvDocument", cvId));
        cvDocumentRepository.delete(doc);
    }
}
