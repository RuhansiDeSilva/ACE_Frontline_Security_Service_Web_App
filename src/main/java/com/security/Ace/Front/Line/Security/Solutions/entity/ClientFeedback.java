package com.security.Ace.Front.Line.Security.Solutions.entity;

import java.time.LocalDateTime;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.FeedbackStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "client_feedbacks",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_client_feedback_month",
                columnNames = {"client_id", "submission_month", "submission_year"}
        ))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    private Integer feedbackId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    // Overall service rating (1-5 stars)
    @Column(name = "overall_rating", nullable = false)
    private Integer overallRating;

    // Officer conduct rating (1-5 stars)
    @Column(name = "officer_conduct_rating")
    private Integer officerConductRating;

    // Response time rating (1-5 stars)
    @Column(name = "response_time_rating")
    private Integer responseTimeRating;

    // Communication rating (1-5 stars)
    @Column(name = "communication_rating")
    private Integer communicationRating;

    // Written comment — max 500 characters per guide
    @Column(name = "comments", nullable = false, length = 500)
    private String comments;

    @Column(name = "improvements", columnDefinition = "TEXT")
    private String improvements;

    // Client can choose to submit anonymously
    @Column(name = "is_anonymous")
    private Boolean isAnonymous = false;

    // Enforces once-per-month submission (backed by unique constraint above)
    @Column(name = "submission_month")
    private Integer submissionMonth;

    @Column(name = "submission_year")
    private Integer submissionYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private FeedbackStatus status = FeedbackStatus.PENDING;

    @Column(name = "is_approved")
    private Boolean isApproved = false;

    // Only non-anonymous, 4-5 star reviews shown on homepage (per guide Phase 16)
    @Column(name = "display_on_homepage")
    private Boolean displayOnHomepage = false;

    @Column(name = "admin_response", columnDefinition = "TEXT")
    private String adminResponse;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}