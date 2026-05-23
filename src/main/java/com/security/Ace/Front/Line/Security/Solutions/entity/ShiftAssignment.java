package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "shift_assignments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"shift_id", "security_officer_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "security_officer_id", nullable = false)
    private SecurityOfficer securityOfficer;

    // Denormalized field so reports/queries can directly see the client company
    // for this assignment (copied from security_officers.assigned_company at insert time).
    @Column(name = "client_company_name")
    private String clientCompanyName;
}