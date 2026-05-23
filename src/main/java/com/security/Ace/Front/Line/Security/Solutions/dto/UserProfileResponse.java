package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String username;
    private String role;

    // Personal
    private String fullName;
    private String nicNumber;
    private String sex;
    private String email;
    private String residentialAddress;
    private String mobileNumber;
    private LocalDate dateOfBirth;
    private String emergencyContact;
    private String photoUrl;

    // Professional
    private String professionalCertificate;
    private String assignedArea;
    private String assignedCompany;
    private LocalDate joinDate;
    private String designation;
    private Double basicSalary;
    private String adminPosition;
    private String specialSkills;

    // Bank
    private String bankName;
    private String bankAccountNumber;
    private String bankBranch;

    private Boolean active;

    private LocalDateTime createdAt;
}
