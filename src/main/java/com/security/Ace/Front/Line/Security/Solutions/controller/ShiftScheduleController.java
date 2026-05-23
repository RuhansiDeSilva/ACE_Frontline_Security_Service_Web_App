package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.service.AuthService;
import com.security.Ace.Front.Line.Security.Solutions.service.ShiftScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shift-schedules")
@CrossOrigin(origins = "http://localhost:5173")
public class ShiftScheduleController {

    @Autowired
    private ShiftScheduleService scheduleService;

    @Autowired
    private AuthService authService;

    @PostMapping
    public ResponseEntity<ShiftScheduleDTO> createSchedule(@RequestBody CreateScheduleRequest request) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(scheduleService.createSchedule(request, currentUser.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftScheduleDTO> getScheduleById(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.getScheduleById(id));
    }

    @PostMapping("/{id}/assignments")
    public ResponseEntity<Void> assignOfficersToShift(
            @PathVariable Long id,
            @RequestBody AssignOfficerRequest request) {
        User currentUser = authService.getCurrentUser();
        scheduleService.assignOfficersToShift(id, request, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/assignments/{assignmentId}")
    public ResponseEntity<Void> removeAssignment(@PathVariable Long assignmentId) {
        User currentUser = authService.getCurrentUser();
        scheduleService.removeAssignment(assignmentId, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<Void> submitSchedule(@PathVariable Long id) {
        scheduleService.submitSchedule(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Void> approveSchedule(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        scheduleService.approveSchedule(id, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/submitted")
    public ResponseEntity<List<ShiftScheduleDTO>> getSubmittedSchedules() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(scheduleService.getSubmittedSchedules(currentUser.getId()));
    }

    @PostMapping("/{id}/auto-generate")
    public ResponseEntity<Void> autoGenerateSchedule(@PathVariable Long id) {
        scheduleService.autoGenerateSchedule(id);
        return ResponseEntity.ok().build();
    }

    // Used by the Area Manager JSO page to load a schedule by clientId + month + year
    @GetMapping("/by-company")
    public ResponseEntity<ShiftScheduleDTO> getScheduleByCompanyAndMonthAndYear(
            @RequestParam Integer clientId,
            @RequestParam Integer month,
            @RequestParam Integer year
    ) {
        return ResponseEntity.ok(
                scheduleService.getScheduleByCompanyAndMonthAndYear(clientId, month, year)
        );
    }

    @GetMapping("/area-manager/month")
    public ResponseEntity<List<ShiftScheduleDTO>> getAreaManagerSchedulesForMonth(
            @RequestParam Integer month,
            @RequestParam Integer year
    ) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(
                scheduleService.getAreaManagerSchedulesForMonth(currentUser.getId(), month, year)
        );
    }

    @GetMapping("/area-manager/history")
    public ResponseEntity<List<ShiftScheduleDTO>> getAreaManagerApprovedHistory(
            @RequestParam Integer month,
            @RequestParam Integer year
    ) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(
                scheduleService.getAreaManagerApprovedHistory(currentUser.getId(), month, year)
        );
    }

    @PostMapping("/area-manager/{id}/assignments")
    public ResponseEntity<Void> assignOfficersToShiftAsAreaManager(
            @PathVariable Long id,
            @RequestBody AssignOfficerRequest request
    ) {
        User currentUser = authService.getCurrentUser();
        scheduleService.assignOfficersToShiftAsAreaManager(id, request, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/area-manager/assignments/{assignmentId}")
    public ResponseEntity<Void> removeAssignmentAsAreaManager(@PathVariable Long assignmentId) {
        User currentUser = authService.getCurrentUser();
        scheduleService.removeAssignmentAsAreaManager(assignmentId, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my-approved")
    public ResponseEntity<List<ShiftScheduleDTO>> getMyApprovedSchedules() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(scheduleService.getApprovedSchedulesForOfficer(currentUser.getId()));
    }

    @GetMapping("/client/{clientId}/current")
    public ResponseEntity<List<ShiftScheduleDTO>> getClientCurrentSchedules(@PathVariable Integer clientId) {
        return ResponseEntity.ok(scheduleService.getClientCurrentSchedules(clientId));
    }

    @GetMapping("/filter")
    public ResponseEntity<List<ShiftScheduleDTO>> getFilteredSchedules(
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String month
    ) {
        return ResponseEntity.ok(scheduleService.getFilteredSchedules(company, month));
    }

    @GetMapping("/officer/current-schedule")
    public ResponseEntity<ShiftScheduleDTO> getOfficerCurrentSchedule(
            @RequestParam Integer month,
            @RequestParam Integer year
    ) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(
                scheduleService.getOfficerCurrentSchedule(currentUser.getId(), month, year)
        );
    }

    @PostMapping("/officer/create-schedule")
    public ResponseEntity<ShiftScheduleDTO> createOfficerSchedule(
            @RequestParam Integer month,
            @RequestParam Integer year
    ) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(
                scheduleService.createOfficerSchedule(currentUser.getId(), month, year)
        );
    }
}