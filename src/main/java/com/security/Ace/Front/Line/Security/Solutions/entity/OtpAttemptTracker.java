package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_attempt_trackers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpAttemptTracker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private int failedAttempts = 0;

    @Column(nullable = false)
    private LocalDateTime lastAttemptAt;

    @Column(nullable = false)
    private boolean locked = false;

    private LocalDateTime lockedUntil;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastAttemptAt = LocalDateTime.now();
    }

    public boolean isLocked() {
        if (!locked) {
            return false;
        }
        if (lockedUntil != null && LocalDateTime.now().isAfter(lockedUntil)) {
            locked = false;
            failedAttempts = 0;
            return false;
        }
        return true;
    }

    public void recordFailedAttempt() {
        this.failedAttempts++;
        this.lastAttemptAt = LocalDateTime.now();
        if (this.failedAttempts >= 3) {
            this.locked = true;
            this.lockedUntil = LocalDateTime.now().plusMinutes(15);
        }
    }

    public void resetAttempts() {
        this.failedAttempts = 0;
        this.locked = false;
        this.lockedUntil = null;
    }
}
