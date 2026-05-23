package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.OfficerRank;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ShiftType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assigned_officers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignedOfficer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignment_id")
    private Integer assignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "officer_id", nullable = false)
    private Integer officerId;

    @Column(name = "officer_name", nullable = false, length = 100)
    private String officerName;

    // ✅ FIX: renamed column from "rank" (MySQL reserved word) to "officer_rank"
    @Enumerated(EnumType.STRING)
    @Column(name = "officer_rank", length = 12)
    private OfficerRank officerRank;

    @Enumerated(EnumType.STRING)
    @Column(name = "shift_type", nullable = false, length = 20)
    private ShiftType shiftType;

    @Column(name = "assigned_from", nullable = false)
    private LocalDate assignedFrom;

    @Column(name = "assigned_to")
    private LocalDate assignedTo;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "duties", columnDefinition = "TEXT")
    private String duties;

    @Column(name = "contact_number", length = 15)
    private String contactNumber;

    @Column(name = "assigned_at", updatable = false)
    private LocalDateTime assignedAt = LocalDateTime.now();
}