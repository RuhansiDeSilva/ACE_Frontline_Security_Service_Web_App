package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ScheduleStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "shift_schedules", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "client_id", "month", "schedule_year" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Active model: maps directly to clients.client_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(nullable = false)
    private Integer month;

    @Column(name = "schedule_year", nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScheduleStatus status = ScheduleStatus.DRAFT;

    private LocalDateTime submittedDate;

    private LocalDateTime approvedDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private boolean editedByAreaManager = false;

    private LocalDateTime areaManagerEditedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
