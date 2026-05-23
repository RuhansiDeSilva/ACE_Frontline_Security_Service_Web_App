package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_inquiries")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceInquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String contactPerson;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String companyAddress;

    @Column(nullable = false)
    private Integer numberOfOfficers;

    @Column(nullable = false)
    private String serviceLocation;

    @Column(nullable = false)
    private String serviceDuration; // short-term or long-term

    @Column(columnDefinition = "LONGTEXT")
    private String additionalNotes;

    @Column(name = "submitted_date", nullable = false, updatable = false)
    private LocalDateTime submittedDate;

    @Column(name = "status")
    private String status = "NEW";

    @Column(name = "replied")
    private Boolean replied = false;

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    @Column(name = "reply_message", columnDefinition = "LONGTEXT")
    private String replyMessage;

    @Column(name = "document_notes", columnDefinition = "LONGTEXT")
    private String documentNotes;

    @Column(name = "sent_to_admin")
    private Boolean sentToAdmin = false;

    @Column(name = "officer_roles", columnDefinition = "LONGTEXT")
    private String officerRoles; // JSON format: {"role": count, ...}

    @PrePersist
    protected void onCreate() {
        submittedDate = LocalDateTime.now();
        if (status == null) status = "NEW";
    }
}