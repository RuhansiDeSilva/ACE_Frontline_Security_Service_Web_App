package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceInquiryDTO {
    private Long id;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Contact person is required")
    private String contactPerson;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9\\-\\+\\s()]*$", message = "Phone number should be valid")
    private String phoneNumber;

    @NotBlank(message = "Company address is required")
    private String companyAddress;

    @NotNull(message = "Number of officers required")
    private Integer numberOfOfficers;

    @NotBlank(message = "Service location is required")
    private String serviceLocation;

    @NotBlank(message = "Service duration is required")
    private String serviceDuration;

    private String additionalNotes;

    private String submittedDate;

    private String status;

    private Boolean replied;

    private String repliedAt;

    private String replyMessage;

    private String documentNotes;

    private Boolean sentToAdmin;

    private String officerRoles; // JSON format with officer breakdown by role

    // Getters
    public Long getId() {
        return id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getCompanyAddress() {
        return companyAddress;
    }

    public Integer getNumberOfOfficers() {
        return numberOfOfficers;
    }

    public String getServiceLocation() {
        return serviceLocation;
    }

    public String getServiceDuration() {
        return serviceDuration;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public String getSubmittedDate() {
        return submittedDate;
    }

    public String getStatus() {
        return status;
    }

    public Boolean getReplied() {
        return replied;
    }

    public String getRepliedAt() {
        return repliedAt;
    }

    public String getReplyMessage() {
        return replyMessage;
    }

    public String getDocumentNotes() {
        return documentNotes;
    }

    public Boolean getSentToAdmin() {
        return sentToAdmin;
    }

    public String getOfficerRoles() {
        return officerRoles;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setCompanyAddress(String companyAddress) {
        this.companyAddress = companyAddress;
    }

    public void setNumberOfOfficers(Integer numberOfOfficers) {
        this.numberOfOfficers = numberOfOfficers;
    }

    public void setServiceLocation(String serviceLocation) {
        this.serviceLocation = serviceLocation;
    }

    public void setServiceDuration(String serviceDuration) {
        this.serviceDuration = serviceDuration;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public void setSubmittedDate(String submittedDate) {
        this.submittedDate = submittedDate;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setReplied(Boolean replied) {
        this.replied = replied;
    }

    public void setRepliedAt(String repliedAt) {
        this.repliedAt = repliedAt;
    }

    public void setReplyMessage(String replyMessage) {
        this.replyMessage = replyMessage;
    }

    public void setDocumentNotes(String documentNotes) {
        this.documentNotes = documentNotes;
    }

    public void setSentToAdmin(Boolean sentToAdmin) {
        this.sentToAdmin = sentToAdmin;
    }

    public void setOfficerRoles(String officerRoles) {
        this.officerRoles = officerRoles;
    }
}