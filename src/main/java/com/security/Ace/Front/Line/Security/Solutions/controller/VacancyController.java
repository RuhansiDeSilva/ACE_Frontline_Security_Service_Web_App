package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.JobVacancyDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponseDTO;
import com.security.Ace.Front.Line.Security.Solutions.service.VacancyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api")
@Validated
public class VacancyController {

    @Autowired
    private VacancyService vacancyService;

    /**
     * Get all open vacancies (Public endpoint)
     */
    @GetMapping("/public/vacancies")
    public ResponseEntity<ApiResponseDTO<List<JobVacancyDTO>>> getPublicVacancies() {
        List<JobVacancyDTO> vacancies = vacancyService.getPublicVacancies();
        ApiResponseDTO<List<JobVacancyDTO>> response = new ApiResponseDTO<>(
                true,
                "Open vacancies retrieved successfully",
                vacancies
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get open vacancies by location (Public endpoint)
     */
    @GetMapping("/public/vacancies/location/{location}")
    public ResponseEntity<ApiResponseDTO<List<JobVacancyDTO>>> getPublicVacanciesByLocation(
            @PathVariable String location) {
        List<JobVacancyDTO> vacancies = vacancyService.getPublicVacanciesByLocation(location);
        ApiResponseDTO<List<JobVacancyDTO>> response = new ApiResponseDTO<>(
                true,
                "Open vacancies by location retrieved successfully",
                vacancies
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get open vacancies by experience level (Public endpoint).
     */
    @GetMapping("/public/vacancies/experience/{experienceLevel}")
    public ResponseEntity<ApiResponseDTO<List<JobVacancyDTO>>> getPublicVacanciesByExperienceLevel(
            @PathVariable String experienceLevel) {
        List<JobVacancyDTO> vacancies = vacancyService.getPublicVacanciesByExperienceLevel(experienceLevel);
        ApiResponseDTO<List<JobVacancyDTO>> response = new ApiResponseDTO<>(
                true,
                "Open vacancies by experience level retrieved successfully",
                vacancies
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get all vacancies (Admin only)
     */
    @GetMapping("/vacancies")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<JobVacancyDTO>>> getAllVacancies() {
        List<JobVacancyDTO> vacancies = vacancyService.getAllVacancies();
        ApiResponseDTO<List<JobVacancyDTO>> response = new ApiResponseDTO<>(
                true,
                "All vacancies retrieved successfully",
                vacancies
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get vacancy by ID (Admin only)
     */
    @GetMapping("/vacancies/{id}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<JobVacancyDTO>> getVacancyById(@PathVariable Long id) {
        JobVacancyDTO vacancy = vacancyService.getVacancyById(id);
        ApiResponseDTO<JobVacancyDTO> response = new ApiResponseDTO<>(
                true,
                "Vacancy retrieved successfully",
                vacancy
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Create a new vacancy (Admin only)
     */
    @PostMapping("/vacancies")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<JobVacancyDTO>> createVacancy(@Valid @RequestBody JobVacancyDTO vacancyDTO) {
        JobVacancyDTO createdVacancy = vacancyService.createVacancy(vacancyDTO);
        ApiResponseDTO<JobVacancyDTO> response = new ApiResponseDTO<>(
                true,
                "Vacancy created successfully",
                createdVacancy
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update an existing vacancy (Admin only)
     */
    @PutMapping("/vacancies/{id}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<JobVacancyDTO>> updateVacancy(
            @PathVariable Long id,
            @Valid @RequestBody JobVacancyDTO vacancyDTO) {
        JobVacancyDTO updatedVacancy = vacancyService.updateVacancy(id, vacancyDTO);
        ApiResponseDTO<JobVacancyDTO> response = new ApiResponseDTO<>(
                true,
                "Vacancy updated successfully",
                updatedVacancy
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a vacancy (Admin only)
     */
    @DeleteMapping("/vacancies/{id}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<Object>> deleteVacancy(@PathVariable Long id) {
        vacancyService.deleteVacancy(id);
        ApiResponseDTO<Object> response = new ApiResponseDTO<>(true, "Vacancy deleted successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Close a vacancy (Admin only)
     */
    @PutMapping("/vacancies/{id}/close")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<JobVacancyDTO>> closeVacancy(@PathVariable Long id) {
        JobVacancyDTO closedVacancy = vacancyService.closeVacancy(id);
        ApiResponseDTO<JobVacancyDTO> response = new ApiResponseDTO<>(
                true,
                "Vacancy closed successfully",
                closedVacancy
        );
        return ResponseEntity.ok(response);
    }
}
