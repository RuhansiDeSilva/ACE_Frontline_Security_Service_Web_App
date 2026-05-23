package com.security.Ace.Front.Line.Security.Solutions.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.Designation;

import java.util.Collection;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // e.g. AREA_MANAGER, OPERATIONAL_MANAGER, EXECUTIVE, CHAIRMAN, DIRECTOR, ACCOUNTANT

    @Column(name = "is_active", columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive = true;

    @Column(name = "admin_position")
    private String adminPosition;

    @Column(name = "assigned_area")
    private String assignedArea;

    @Column(name = "assigned_company")
    private String assignedCompany;

    @Column(name = "bank_account_number")
    private String bankAccountNumber;

    @Column(name = "bank_branch")
    private String bankBranch;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "basic_salary")
    private Double basicSalary;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column
    private String designation;

    @Column(name = "emergency_contact")
    private String emergencyContact;

    @Column(name = "first_login", columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean firstLogin = true;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "nic_number")
    private String nicNumber;

    @Column(name = "photo_path")
    private String photoPath;

    @Column(name = "professional_certificate")
    private String professionalCertificate;

    @Column(name = "residential_address", columnDefinition = "text")
    private String residentialAddress;

    @Column
    private String sex;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(name = "qr_activated", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean qrActivated = false;

    @Column(name = "special_skills")
    private String specialSkills;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_password_changed_at")
    private LocalDateTime lastPasswordChangedAt;

    @Column
    private String username;

    @Column(name = "handover_equipment", columnDefinition = "json")
    private List<Object> handoverEquipment;

    // Relationships expected by repositories/services (e.g. findByRoleAndBranch_Id)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    // Convenience constructor used by DataSeeder and other simple creations
    public User(Long id, String email, String password, String role) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    /** Seeder / shift scheduling: designation, client company (officers), branch (area managers). */
    public User(Long id, String email, String password, String role, String designation,
                  Client client, Branch branch) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
        this.designation = designation;
        this.client = client;
        this.branch = branch;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive != null && isActive;
    }
}
