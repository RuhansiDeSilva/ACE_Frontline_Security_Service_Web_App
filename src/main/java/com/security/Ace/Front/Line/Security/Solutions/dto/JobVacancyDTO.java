package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobVacancyDTO {

    private Long id;

    @NotBlank(message = "Job title is required")
    private String jobTitle;

    @NotBlank(message = "Description is required")
    private String description;

    private String requirements;

    @NotBlank(message = "Experience level is required")
    private String experienceLevel; // ENTRY, INTERMEDIATE, SENIOR, EXPERT.

    @NotBlank(message = "Location is required")
    private String location;

    // salary is no longer required; kept for backwards compatibility but not used by UI
    private Double minSalary;

    private Double maxSalary;

    @NotBlank(message = "Status is required")
    private String status; // OPEN, CLOSED

    private String createdAt;

    private String updatedAt;

    // Getters
    public Long getId() {
        return id;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public String getDescription() {
        return description;
    }

    public String getRequirements() {
        return requirements;
    }

    public String getExperienceLevel() {
        return experienceLevel;
    }

    public String getLocation() {
        return location;
    }

    public Double getMinSalary() {
        return minSalary;
    }

    public Double getMaxSalary() {
        return maxSalary;
    }

    public String getStatus() {
        return status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public void setExperienceLevel(String experienceLevel) {
        this.experienceLevel = experienceLevel;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setMinSalary(Double minSalary) {
        this.minSalary = minSalary;
    }

    public void setMaxSalary(Double maxSalary) {
        this.maxSalary = maxSalary;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
