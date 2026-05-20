package com.cvcraft.repository;

import com.cvcraft.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'CANDIDATE' AND u.isActive = true")
    long countActiveCandidates();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'RECRUITER' AND u.isActive = true")
    long countActiveRecruiters();
}
