package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;



@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "advance_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)

    private User user;

    /**
     * Amount is validated to be max 10% of basic salary.
     * Request is only allowed before the 15th of the month.
     */
    @Column(nullable = false)
    private Double amount;

    @Column(columnDefinition = "TEXT")
    private String reason;

    // Month/Year of the advance (e.g., 2024-01)
    private String forMonth;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_reviewed_by")
    private User areaReviewedBy;

    private LocalDateTime areaReviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;

    @Builder.Default
    private boolean deducted = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}






