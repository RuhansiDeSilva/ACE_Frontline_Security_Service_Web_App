package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponseDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.BulkInterviewScheduleDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.InterviewDTO;
import com.security.Ace.Front.Line.Security.Solutions.service.InterviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    @Autowired
    private InterviewService interviewService;

    /**
     * Get all interviews with applicant lists
     */
    @GetMapping
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('EXECUTIVE')")
    public ResponseEntity<ApiResponseDTO<List<InterviewDTO>>> getAllInterviews() {
        List<InterviewDTO> interviews = interviewService.getAllInterviews();
        ApiResponseDTO<List<InterviewDTO>> response = new ApiResponseDTO<>(
                true,
                "Interviews retrieved successfully",
                interviews
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get interviews by vacancy
     */
    @GetMapping("/vacancy/{vacancyId}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('EXECUTIVE')")
    public ResponseEntity<ApiResponseDTO<List<InterviewDTO>>> getInterviewsByVacancy(@PathVariable Long vacancyId) {
        List<InterviewDTO> interviews = interviewService.getInterviewsByVacancy(vacancyId);
        ApiResponseDTO<List<InterviewDTO>> response = new ApiResponseDTO<>(
                true,
                "Interviews for vacancy retrieved successfully",
                interviews
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Schedule interviews in bulk — select applicants from multiple vacancies
     */
    @PostMapping("/schedule-bulk")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<InterviewDTO>>> scheduleBulk(
            @Valid @RequestBody BulkInterviewScheduleDTO dto) {
        try {
            List<InterviewDTO> interviews = interviewService.scheduleBulk(dto);
            int appCount = dto.getApplicationIds() != null ? dto.getApplicationIds().size() : 0;
            int cvCount = dto.getCvSubmissionIds() != null ? dto.getCvSubmissionIds().size() : 0;
            int totalCount = appCount + cvCount;
            return ResponseEntity.ok(new ApiResponseDTO<>(
                    true,
                    "Interviews scheduled successfully for " + totalCount + " applicant(s)",
                    interviews
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponseDTO<>(false, e.getMessage(), null));
        }
    }

    /**
     * Delete an interview
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<Void>> deleteInterview(@PathVariable Long id) {
        try {
            interviewService.deleteInterview(id);
            return ResponseEntity.ok(new ApiResponseDTO<>(true, "Interview deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponseDTO<>(false, e.getMessage(), null));
        }
    }
}
