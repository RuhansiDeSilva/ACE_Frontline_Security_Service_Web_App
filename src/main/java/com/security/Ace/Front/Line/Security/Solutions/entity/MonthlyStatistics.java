package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_statistics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "area_manager_id", nullable = false)
    private AreaManager areaManager;

    @ManyToOne(optional = false)
    @JoinColumn(name = "security_officer_id", nullable = false)
    private SecurityOfficer securityOfficer;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Integer monthlyShifts;

    @Column(nullable = false)
    private Double monthlyOvertimeHours;

    @Column(nullable = false)
    private Double monthlyTotalHoursWorked;

    @Column(nullable = false)
    private LocalDateTime generatedAt;
}

