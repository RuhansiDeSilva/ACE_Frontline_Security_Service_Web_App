package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FeedbackSubmissionRequest {

    // Overall service rating (1-5 stars)
    @NotNull(message = "Overall rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer overallRating;

    // Officer conduct rating (1-5 stars)
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer officerConductRating;

    // Response time rating (1-5 stars)
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer responseTimeRating;

    // Communication rating (1-5 stars)
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer communicationRating;

    // Written comment — max 500 characters per guide
    @NotBlank(message = "Comments are required")
    @Size(min = 10, max = 500, message = "Comments must be between 10 and 500 characters")
    private String comments;

    private String improvements;

    // Client may submit anonymously — guide Phase 14
    private Boolean isAnonymous = false;
}