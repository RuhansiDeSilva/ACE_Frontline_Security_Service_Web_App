package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "security_officer_id", nullable = false)
    private SecurityOfficer securityOfficer;

    @Column(nullable = false)
    private LocalDate attendanceDate;

    private LocalTime checkInTime;

    private LocalTime checkOutTime;

    @Column(nullable = false)
    private String status; // PRESENT, ABSENT, HALF_DAY, LEAVE

    private String remarks;

    @Column(nullable = false)
    private Double hoursWorked = 0.0;

    private Double overtimeHours = 0.0;

    @ManyToOne
    @JoinColumn(name = "recorded_by")
    private AreaManager recordedBy;

    @Column(nullable = false)
    private Boolean isShiftCounted = true; // Counts towards monthly shift limit
}
