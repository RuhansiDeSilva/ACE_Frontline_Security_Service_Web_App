package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "general_inquiries")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeneralInquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String message;

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

    @PrePersist
    protected void onCreate() {
        submittedDate = LocalDateTime.now();
        if (status == null) status = "NEW";
    }
}