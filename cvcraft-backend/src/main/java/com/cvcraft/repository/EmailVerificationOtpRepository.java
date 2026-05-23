package com.cvcraft.repository;

import com.cvcraft.entity.EmailVerificationOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface EmailVerificationOtpRepository extends JpaRepository<EmailVerificationOtp, Long> {

    Optional<EmailVerificationOtp> findTopByUser_IdAndUsedFalseOrderByCreatedAtDesc(Long userId);

    @Modifying
    @Query("DELETE FROM EmailVerificationOtp o WHERE o.user.id = :userId")
    void deleteAllByUserId(Long userId);
}
