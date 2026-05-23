package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.MonthlyStatisticsDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.service.AuthService;
import com.security.Ace.Front.Line.Security.Solutions.service.MonthlyStatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monthly-statistics")
public class MonthlyStatisticsController {

    @Autowired
    private MonthlyStatisticsService monthlyStatisticsService;

    @Autowired
    private AuthService authService;

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<MonthlyStatisticsDTO>> getMonthlyStatistics(
            @PathVariable Long managerId,
            @RequestParam int month,
            @RequestParam int year) {
        List<MonthlyStatisticsDTO> stats =
                monthlyStatisticsService.getMonthlyStatistics(managerId, month, year);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/me")
    public ResponseEntity<List<MonthlyStatisticsDTO>> getMonthlyStatisticsForCurrentAreaManager(
            @RequestHeader(value = "X-User-Email", required = false) String areaManagerEmail,
            @RequestParam int month,
            @RequestParam int year) {
        String resolvedEmail = areaManagerEmail;
        try {
            User currentUser = authService.getCurrentUser();
            if (currentUser != null && currentUser.getEmail() != null && !currentUser.getEmail().isBlank()) {
                resolvedEmail = currentUser.getEmail().trim();
            }
        } catch (Exception ignored) {
            // fallback to X-User-Email
        }

        List<MonthlyStatisticsDTO> stats =
                monthlyStatisticsService.getMonthlyStatisticsForAreaManagerEmail(resolvedEmail, month, year);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/all")
    public ResponseEntity<List<MonthlyStatisticsDTO>> getMonthlyStatisticsForAllManagers(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(monthlyStatisticsService.getMonthlyStatisticsForAllManagers(month, year));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MonthlyStatisticsDTO> updateMonthlyStatistics(
            @PathVariable Long id,
            @RequestBody MonthlyStatisticsDTO body) {
        MonthlyStatisticsDTO updated = monthlyStatisticsService.updateMonthlyStatistics(
                id,
                body.getMonthlyShifts(),
                body.getMonthlyOvertimeHours()
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMonthlyStatistics(@PathVariable Long id) {
        monthlyStatisticsService.deleteMonthlyStatistics(id);
        return ResponseEntity.noContent().build();
    }
}

