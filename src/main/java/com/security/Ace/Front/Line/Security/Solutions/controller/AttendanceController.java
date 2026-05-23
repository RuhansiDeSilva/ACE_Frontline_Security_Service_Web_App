package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.AttendanceDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.SecurityOfficerUserOptionDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.service.AttendanceService;
import com.security.Ace.Front.Line.Security.Solutions.service.AuthService;
import com.security.Ace.Front.Line.Security.Solutions.service.WeeklyReportService;
//import lk.acefrontline.dto.AttendanceDTO;
//import lk.acefrontline.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;
    @Autowired
    private AuthService authService;
    @Autowired
    private WeeklyReportService weeklyReportService;

    @PostMapping
    public ResponseEntity<?> createAttendance(
            @RequestBody AttendanceDTO dto,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            String resolvedEmail = null;
            try {
                User currentUser = authService.getCurrentUser();
                if (currentUser != null && currentUser.getEmail() != null && !currentUser.getEmail().isBlank()) {
                    resolvedEmail = currentUser.getEmail().trim();
                }
            } catch (Exception ignored) {
                // Fallback to header below.
            }

            if ((resolvedEmail == null || resolvedEmail.isBlank())
                    && userEmail != null && !userEmail.isBlank()) {
                resolvedEmail = userEmail.trim();
            }

            if (resolvedEmail == null || resolvedEmail.isBlank()) {
                return ResponseEntity.badRequest().body("Unable to resolve authenticated area manager user");
            }

            Long managerId = weeklyReportService.resolveOrCreateAreaManagerIdByEmailOrFallback(
                    resolvedEmail, null);
            AttendanceDTO created = attendanceService.createAttendance(dto, managerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAttendance(@PathVariable Long id, @RequestBody AttendanceDTO dto) {
        try {
            AttendanceDTO updated = attendanceService.updateAttendance(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/officer/{officerId}")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceByOfficer(@PathVariable Long officerId) {
        List<AttendanceDTO> attendance = attendanceService.getAttendanceByOfficer(officerId);
        return ResponseEntity.ok(attendance);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AttendanceDTO> attendance = attendanceService.getAttendanceByDateRange(startDate, endDate);
        return ResponseEntity.ok(attendance);
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceByManager(
            @PathVariable Long managerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AttendanceDTO> attendance = attendanceService.getAttendanceByManagerInPeriod(managerId, startDate, endDate);
        return ResponseEntity.ok(attendance);
    }

    @GetMapping("/manager/{managerId}/approved-officers")
    public ResponseEntity<List<SecurityOfficer>> getApprovedOfficersByDate(
            @PathVariable Long managerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getApprovedOfficersByDate(managerId, date));
    }

    /** Officers with an allocation on {@code date} on any APPROVED schedule (attendance officer dropdown). */
    @GetMapping("/approved-officers")
    public ResponseEntity<List<SecurityOfficerUserOptionDTO>> getApprovedOfficersByShiftDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<SecurityOfficerUserOptionDTO> list = attendanceService.getApprovedOfficersByShiftDate(date).stream()
                .map(o -> new SecurityOfficerUserOptionDTO(o.getId(), o.getFullName(), o.getSecurityId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Long id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.noContent().build();
    }
}

