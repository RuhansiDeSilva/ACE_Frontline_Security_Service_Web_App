package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class FeedbackResponse {

    private Integer feedbackId;
    private Integer clientId;
    private String companyName;
    private Integer overallRating;
    private Integer officerConductRating;
    private Integer responseTimeRating;
    private Integer communicationRating;
    private String comments;
    private String improvements;
    private Boolean isAnonymous;
    private Integer submissionMonth;
    private Integer submissionYear;
    private String status;
    private Boolean isApproved;
    private Boolean displayOnHomepage;
    private String adminResponse;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}