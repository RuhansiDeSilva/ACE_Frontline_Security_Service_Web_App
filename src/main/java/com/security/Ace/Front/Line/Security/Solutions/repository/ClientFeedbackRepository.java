package com.security.Ace.Front.Line.Security.Solutions.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.ClientFeedback;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.FeedbackStatus;

@Repository
public interface ClientFeedbackRepository extends JpaRepository<ClientFeedback, Integer> {

    List<ClientFeedback> findByClientClientIdOrderByCreatedAtDesc(Integer clientId);

    List<ClientFeedback> findByStatusOrderByCreatedAtDesc(FeedbackStatus status);

    // Homepage display: approved, display flag set, non-anonymous OR anonymous consented,
    // 4-5 star only — top 6 latest per guide Phase 16
    @Query("SELECT f FROM ClientFeedback f WHERE f.isApproved = true AND f.displayOnHomepage = true " +
            "AND f.overallRating >= 4 ORDER BY f.createdAt DESC")
    List<ClientFeedback> findApprovedForHomepage();

    // Pending review queue — PENDING status
    @Query("SELECT f FROM ClientFeedback f WHERE f.status = 'PENDING' ORDER BY f.createdAt ASC")
    List<ClientFeedback> findPendingReview();

    // Check if client already submitted feedback for a given month/year (once-per-month rule)
    Optional<ClientFeedback> findByClientClientIdAndSubmissionMonthAndSubmissionYear(
            Integer clientId, Integer month, Integer year);

    // Overall average rating across all approved feedback
    @Query("SELECT AVG(f.overallRating) FROM ClientFeedback f WHERE f.isApproved = true")
    Double getOverallAverageRating();

    // Average officer conduct rating
    @Query("SELECT AVG(f.officerConductRating) FROM ClientFeedback f " +
            "WHERE f.isApproved = true AND f.officerConductRating IS NOT NULL")
    Double getAverageOfficerConductRating();

    // Average response time rating
    @Query("SELECT AVG(f.responseTimeRating) FROM ClientFeedback f " +
            "WHERE f.isApproved = true AND f.responseTimeRating IS NOT NULL")
    Double getAverageResponseTimeRating();

    // Average rating per client (for admin feedback report)
    @Query("SELECT AVG(f.overallRating) FROM ClientFeedback f " +
            "WHERE f.client.clientId = :clientId AND f.isApproved = true")
    Double getAverageRatingForClient(@Param("clientId") Integer clientId);

    @Query("SELECT COUNT(f) FROM ClientFeedback f WHERE f.overallRating = :rating AND f.isApproved = true")
    long countByRating(@Param("rating") Integer rating);

    List<ClientFeedback> findByIsApprovedTrueOrderByCreatedAtDesc();
}