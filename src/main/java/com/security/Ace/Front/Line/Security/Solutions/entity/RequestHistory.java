package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "request_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long inquiryId;

    @Column(nullable = false)
    private String inquiryType; // "SERVICE" or "GENERAL"

    @Column(nullable = false)
    private String action; // CREATED, REPLIED, STATUS_CHANGED, DOCUMENT_UPDATED, SENT_TO_ADMIN, OFFICER_ASSIGNED, CLOSED

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "action_by")
    private String actionBy; // username/email of who performed action, default "SYSTEM"

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "LONGTEXT")
    private String metadata; // JSON string for additional data

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (actionBy == null) {
            actionBy = "SYSTEM";
        }
    }
}
