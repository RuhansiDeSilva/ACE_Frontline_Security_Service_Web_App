package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewEmailDTO {

    @NotNull(message = "Application ID is required")
    private Long applicationId;

    @NotBlank(message = "Interview date is required")
    private String interviewDate; // Format: YYYY-MM-DD

    @NotBlank(message = "Interview time is required")
    private String interviewTime; // Format: HH:mm

    @NotBlank(message = "Interview location is required")
    private String interviewLocation;

    public Long getApplicationId() {
        return applicationId;
    }

    public String getInterviewDate() {
        return interviewDate;
    }

    public String getInterviewTime() {
        return interviewTime;
    }

    public String getInterviewLocation() {
        return interviewLocation;
    }

    public void setApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }

    public void setInterviewDate(String interviewDate) {
        this.interviewDate = interviewDate;
    }

    public void setInterviewTime(String interviewTime) {
        this.interviewTime = interviewTime;
    }

    public void setInterviewLocation(String interviewLocation) {
        this.interviewLocation = interviewLocation;
    }
}
