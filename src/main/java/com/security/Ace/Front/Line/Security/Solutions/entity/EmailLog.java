package com.security.Ace.Front.Line.Security.Solutions.entity;

import java.time.LocalDateTime;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.EmailStatus;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.EmailType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "email_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "email_id")
    private Integer emailId;

    @Column(name = "recipient_email", nullable = false, length = 100)
    private String recipientEmail;

    @Column(name = "recipient_name", length = 100)
    private String recipientName;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_type", length = 30)
    private EmailType emailType;

    @Column(name = "subject", length = 255)
    private String subject;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Column(name = "sent_at", updatable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10)
    private EmailStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    // Related entity ID — e.g. invoiceId, paymentId, clientId
    @Column(name = "related_id")
    private Integer relatedId;
}