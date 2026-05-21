package com.cvcraft.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "cv_documents")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CvDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "template_id", length = 50)
    private String templateId;

    @Column(name = "file_name", length = 200)
    private String fileName;

    @Column(name = "download_url", length = 500)
    private String downloadUrl;

    @Column(name = "ats_score")
    private Integer atsScore;

    @Column(name = "jd_title", length = 200)
    private String jdTitle;

    @Column(name = "jd_text", columnDefinition = "TEXT")
    private String jdText;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
