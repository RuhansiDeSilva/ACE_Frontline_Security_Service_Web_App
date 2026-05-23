package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String nic; // National ID Card

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String address;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String experience;

    @Column(nullable = false)
    private String cvFilePath;

    // certificate is optional, column may be null when none uploaded,
    @Column(nullable = true)
    private String certificateFilePath;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ApplicationStatus applicationStatus; // PENDING, SHORTLISTED, REJECTED, INTERVIEW_SENT

    @Column(name = "applied_date", nullable = false, updatable = false)
    private LocalDateTime appliedDate;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name="vacancy_id",nullable = false)
    private Long vacancyId;

    // Interview details (added later for scheduling)
    @Column(name = "interview_date_time")
    private LocalDateTime interviewDateTime;

    @Column(name = "interview_location", columnDefinition = "LONGTEXT")
    private String interviewLocation;

    @Column(name = "interview_id")
    private Long interviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", insertable = false, updatable = false)
    private Interview interview;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacancy_id", insertable = false, updatable = false)
    private JobVacancy jobVacancy;

    @PrePersist
    protected void onCreate() {
        appliedDate = LocalDateTime.now();
        updatedDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = LocalDateTime.now();
    }

    public enum ApplicationStatus {
        PENDING, SHORTLISTED, REJECTED, INTERVIEW_SENT, SELECTED
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getNic() {
        return nic;
    }

    public void setNic(String nic) {
        this.nic = nic;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getCvFilePath() {
        return cvFilePath;
    }

    public void setCvFilePath(String cvFilePath) {
        this.cvFilePath = cvFilePath;
    }

    public String getCertificateFilePath() {
        return certificateFilePath;
    }

    public void setCertificateFilePath(String certificateFilePath) {
        this.certificateFilePath = certificateFilePath;
    }

    public ApplicationStatus getApplicationStatus() {
        return applicationStatus;
    }

    public void setApplicationStatus(ApplicationStatus applicationStatus) {
        this.applicationStatus = applicationStatus;
    }

    public LocalDateTime getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(LocalDateTime appliedDate) {
        this.appliedDate = appliedDate;
    }

    public LocalDateTime getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(LocalDateTime updatedDate) {
        this.updatedDate = updatedDate;
    }

    public Long getVacancyId() {
        return vacancyId;
    }

    public void setVacancyId(Long vacancyId) {
        this.vacancyId = vacancyId;
    }

    public JobVacancy getJobVacancy() {
        return jobVacancy;
    }

    public void setJobVacancy(JobVacancy jobVacancy) {
        this.jobVacancy = jobVacancy;
    }

    public LocalDateTime getInterviewDateTime() {
        return interviewDateTime;
    }

    public void setInterviewDateTime(LocalDateTime interviewDateTime) {
        this.interviewDateTime = interviewDateTime;
    }

    public String getInterviewLocation() {
        return interviewLocation;
    }

    public void setInterviewLocation(String interviewLocation) {
        this.interviewLocation = interviewLocation;
    }

    public Long getInterviewId() {
        return interviewId;
    }

    public void setInterviewId(Long interviewId) {
        this.interviewId = interviewId;
    }

    public Interview getInterview() {
        return interview;
    }

    public void setInterview(Interview interview) {
        this.interview = interview;
    }}