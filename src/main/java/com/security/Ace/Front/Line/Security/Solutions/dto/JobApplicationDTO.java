package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobApplicationDTO {

    private Long id;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "NIC is required")
    private String nic;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9\\-\\+\\s()]*$", message = "Phone number should be valid")
    private String phoneNumber;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "Experience is required")
    private String experience;

    private String cvFilePath;

    private String certificateFilePath;

    @NotNull(message = "Vacancy ID is required")
    private Long vacancyId;

    private String vacancyTitle;

    private String applicationStatus;

    private String appliedDate;

    private String updatedDate;

    // interview information. (optional)
    private String interviewDateTime;
    private String interviewLocation;

    // Getters
    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getNic() {
        return nic;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public String getExperience() {
        return experience;
    }

    public String getCvFilePath() {
        return cvFilePath;
    }

    public String getCertificateFilePath() {
        return certificateFilePath;
    }

    public Long getVacancyId() {
        return vacancyId;
    }

    public String getVacancyTitle() {
        return vacancyTitle;
    }

    public String getApplicationStatus() {
        return applicationStatus;
    }

    public String getAppliedDate() {
        return appliedDate;
    }

    public String getUpdatedDate() {
        return updatedDate;
    }

    public String getInterviewDateTime() {
        return interviewDateTime;
    }

    public String getInterviewLocation() {
        return interviewLocation;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setNic(String nic) {
        this.nic = nic;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public void setCvFilePath(String cvFilePath) {
        this.cvFilePath = cvFilePath;
    }

    public void setCertificateFilePath(String certificateFilePath) {
        this.certificateFilePath = certificateFilePath;
    }

    public void setVacancyId(Long vacancyId) {
        this.vacancyId = vacancyId;
    }

    public void setVacancyTitle(String vacancyTitle) {
        this.vacancyTitle = vacancyTitle;
    }

    public void setApplicationStatus(String applicationStatus) {
        this.applicationStatus = applicationStatus;
    }

    public void setAppliedDate(String appliedDate) {
        this.appliedDate = appliedDate;
    }

    public void setUpdatedDate(String updatedDate) {
        this.updatedDate = updatedDate;
    }

    public void setInterviewDateTime(String interviewDateTime) {
        this.interviewDateTime = interviewDateTime;
    }

    public void setInterviewLocation(String interviewLocation) {
        this.interviewLocation = interviewLocation;
    }
}
