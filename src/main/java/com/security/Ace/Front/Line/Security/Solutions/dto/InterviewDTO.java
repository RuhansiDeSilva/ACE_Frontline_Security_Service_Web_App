package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.util.ArrayList;
import java.util.List;

public class InterviewDTO {

    private Long id;
    private Long vacancyId;
    private String vacancyTitle;
    private String interviewDate;
    private String interviewTime;
    private String interviewLocation;
    private String createdAt;
    private List<InterviewApplicantDTO> applicants;
    private List<CvApplicantDTO> cvApplicants;
    private List<String> interviewerRoles;

    public InterviewDTO() {
        this.applicants = new ArrayList<>();
        this.cvApplicants = new ArrayList<>();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVacancyId() {
        return vacancyId;
    }

    public void setVacancyId(Long vacancyId) {
        this.vacancyId = vacancyId;
    }

    public String getVacancyTitle() {
        return vacancyTitle;
    }

    public void setVacancyTitle(String vacancyTitle) {
        this.vacancyTitle = vacancyTitle;
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

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public List<InterviewApplicantDTO> getApplicants() {
        return applicants;
    }

    public void setApplicants(List<InterviewApplicantDTO> applicants) {
        this.applicants = applicants;
    }

    public List<CvApplicantDTO> getCvApplicants() {
        return cvApplicants;
    }

    public void setCvApplicants(List<CvApplicantDTO> cvApplicants) {
        this.cvApplicants = cvApplicants;
    }

    public List<String> getInterviewerRoles() {
        return interviewerRoles;
    }

    public void setInterviewerRoles(List<String> interviewerRoles) {
        this.interviewerRoles = interviewerRoles;
    }

    /**
     * Nested DTO for applicant details within an interview
     */
    public static class InterviewApplicantDTO {
        private Long applicationId;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String applicationStatus;

        public InterviewApplicantDTO() {
        }

        public Long getApplicationId() {
            return applicationId;
        }

        public void setApplicationId(Long applicationId) {
            this.applicationId = applicationId;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getApplicationStatus() {
            return applicationStatus;
        }

        public void setApplicationStatus(String applicationStatus) {
            this.applicationStatus = applicationStatus;
        }
    }

    /**
     * Nested DTO for CV submission applicants within an interview
     */
    public static class CvApplicantDTO {
        private Long cvSubmissionId;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String status;

        public CvApplicantDTO() {
        }

        public Long getCvSubmissionId() {
            return cvSubmissionId;
        }

        public void setCvSubmissionId(Long cvSubmissionId) {
            this.cvSubmissionId = cvSubmissionId;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
