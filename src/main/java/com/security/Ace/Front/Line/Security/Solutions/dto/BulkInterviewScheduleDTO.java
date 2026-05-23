package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class BulkInterviewScheduleDTO {

    private List<Long> applicationIds;

    private List<Long> cvSubmissionIds;

    @NotBlank(message = "Interview date is required")
    private String interviewDate;

    @NotBlank(message = "Interview time is required")
    private String interviewTime;

    @NotBlank(message = "Interview location is required")
    private String interviewLocation;

    private List<String> interviewerRoles;

    public BulkInterviewScheduleDTO() {}

    public List<Long> getApplicationIds() {
        return applicationIds;
    }

    public void setApplicationIds(List<Long> applicationIds) {
        this.applicationIds = applicationIds;
    }

    public List<Long> getCvSubmissionIds() {
        return cvSubmissionIds;
    }

    public void setCvSubmissionIds(List<Long> cvSubmissionIds) {
        this.cvSubmissionIds = cvSubmissionIds;
    }

    public String getInterviewDate() {
        return interviewDate;
    }

    public void setInterviewDate(String interviewDate) {
        this.interviewDate = interviewDate;
    }

    public String getInterviewTime() {
        return interviewTime;
    }

    public void setInterviewTime(String interviewTime) {
        this.interviewTime = interviewTime;
    }

    public String getInterviewLocation() {
        return interviewLocation;
    }

    public void setInterviewLocation(String interviewLocation) {
        this.interviewLocation = interviewLocation;
    }

    public List<String> getInterviewerRoles() {
        return interviewerRoles;
    }

    public void setInterviewerRoles(List<String> interviewerRoles) {
        this.interviewerRoles = interviewerRoles;
    }
}
