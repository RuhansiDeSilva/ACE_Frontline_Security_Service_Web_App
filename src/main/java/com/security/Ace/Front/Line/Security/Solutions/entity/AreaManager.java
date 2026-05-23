package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "area_managers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AreaManager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String employeeId;

    @Column(nullable = false)
    private String fullName;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String contactNumber;

    @Column(nullable = false)
    private String password; // In production, this should be encrypted

    private String designation = "Area Manager";

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE
}
