package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "monthly_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "area_manager_id", nullable = false)
    private AreaManager areaManager;

    @Column(nullable = false)
    private Integer month; // 1-12

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String problemsFaced;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String rootCauses;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mitigationSteps;

    @Column(columnDefinition = "TEXT")
    private String complaintsReceived;

    @Column(nullable = false)
    private LocalDate generatedDate;

    @Column(columnDefinition = "TEXT")
    private String additionalNotes;

    @Column(nullable = false)
    private String status = "DRAFT"; // DRAFT, SUBMITTED, REVIEWED
}
