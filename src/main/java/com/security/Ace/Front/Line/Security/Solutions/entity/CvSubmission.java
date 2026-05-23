package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "cv_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CvSubmission {

    public enum CvStatus {
        PENDING, INTERVIEW_SENT, SELECTED, REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(name = "cv_file_path")
    private String cvFilePath;

    @Column(name = "submitted_date", nullable = false, updatable = false)
    private LocalDateTime submittedDate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CvStatus status = CvStatus.PENDING;

    @Column(name = "interview_date_time")
    private LocalDateTime interviewDateTime;

    @Column(name = "interview_location", columnDefinition = "LONGTEXT")
    private String interviewLocation;

    @Column(name = "interview_id")
    private Long interviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", insertable = false, updatable = false)
    private Interview interview;

    @PrePersist
    protected void onCreate() {
        submittedDate = LocalDateTime.now();
        if (status == null) {
            status = CvStatus.PENDING;
        }
    }
}
