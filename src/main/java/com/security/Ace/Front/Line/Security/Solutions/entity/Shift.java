package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ShiftType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "shifts", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "schedule_id", "shift_date", "shift_type" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private ShiftSchedule schedule;

    /** Persisted as {@code shift_date} in {@code shifts}. Named {@code shiftDate} in Java to avoid JPA/Spring Data confusion with {@code date} keywords. */
    @Column(name = "shift_date", nullable = false)
    private LocalDate shiftDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "shift_type", nullable = false)
    private ShiftType shiftType;

    @OneToMany(mappedBy = "shift", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ShiftAssignment> assignments;
}
