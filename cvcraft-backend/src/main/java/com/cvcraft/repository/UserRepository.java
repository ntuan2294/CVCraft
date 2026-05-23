package com.cvcraft.repository;

import com.cvcraft.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    long countByRole(User.Role role);
    long countByIsActive(boolean isActive);

    @Query("""
        SELECT u FROM User u
        WHERE (:query = '' OR
               lower(u.email) LIKE lower(concat('%', :query, '%')) OR
               lower(u.fullName) LIKE lower(concat('%', :query, '%')))
        ORDER BY u.createdAt DESC
    """)
    Page<User> searchForAdmin(@Param("query") String query, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'CANDIDATE' AND u.isActive = true")
    long countActiveCandidates();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'ADMIN' AND u.isActive = true")
    long countActiveAdmins();
}
