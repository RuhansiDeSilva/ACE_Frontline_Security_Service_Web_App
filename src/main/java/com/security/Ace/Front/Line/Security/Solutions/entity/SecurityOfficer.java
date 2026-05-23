package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "security_officers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SecurityOfficer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String securityId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String contactNumber;

    private String emailAddress;

    @Column(nullable = false)
    private String assignedCompany;

    @Column(nullable = false)
    private String branch;

    @ManyToOne
    @JoinColumn(name = "area_manager_id")
    private AreaManager areaManager;

    @Column(nullable = false)
    private LocalDate joinedDate;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, ON_LEAVE

    private String address;

    private String nicNumber;

    private LocalDate dateOfBirth;
}
