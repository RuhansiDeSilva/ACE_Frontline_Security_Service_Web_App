package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "weekly_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "security_officer_id", nullable = false)
    private SecurityOfficer securityOfficer;

    @ManyToOne
    @JoinColumn(name = "area_manager_id", nullable = false)
    private AreaManager areaManager;

    @Column(nullable = false)
    private Integer weekNumber;  // week of month: 1=1-7, 2=8-14, 3=15-21, 4=22-end

    @Column
    private Integer month;      // 1-12 (nullable for existing rows)

    @Column(nullable = false)
    private Integer year;

    // The schedule's client company name for this weekly report row.
    // This is used for filtering weekly reports by company in the UI.
    @Column(name = "client_company_name")
    private String clientCompanyName;

    @Column(nullable = false)
    private LocalDate weekStartDate;

    @Column(nullable = false)
    private LocalDate weekEndDate;

    @Column(nullable = false)
    private Integer totalShifts = 0;

    @Column(nullable = false)
    private Double totalOvertimeHours = 0.0;

    @Column(nullable = false)
    private Double totalHoursWorked = 0.0;

    @Column(nullable = false)
    private LocalDate generatedDate;

    private String remarks;
}
