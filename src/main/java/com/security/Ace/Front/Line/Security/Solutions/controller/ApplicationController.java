package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.JobApplicationDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApplicationStatusUpdateDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.InterviewEmailDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponseDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobApplication;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobApplicationRepository;
import com.security.Ace.Front.Line.Security.Solutions.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/applications")
@Validated
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    /**
     * Submit a new job application (Public endpoint)
     */
    @PostMapping("/apply")
    public ResponseEntity<ApiResponseDTO<JobApplicationDTO>> submitApplication(
            @NotNull(message = "Full name is required") @RequestParam String fullName,
            @NotNull(message = "NIC is required") @RequestParam String nic,
            @NotNull(message = "Email is required") @RequestParam String email,
            @NotNull(message = "Phone number is required") @RequestParam String phoneNumber,
            @NotNull(message = "Address is required") @RequestParam String address,
            @NotNull(message = "Experience is required") @RequestParam String experience,
            @NotNull(message = "Vacancy ID is required") @RequestParam Long vacancyId,
            @NotNull(message = "CV file is required") @RequestParam("cvFile") MultipartFile cvFile,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile) {

        JobApplicationDTO applicationDTO = new JobApplicationDTO();
        applicationDTO.setFullName(fullName);
        applicationDTO.setNic(nic);
        applicationDTO.setEmail(email);
        applicationDTO.setPhoneNumber(phoneNumber);
        applicationDTO.setAddress(address);
        applicationDTO.setExperience(experience);
        applicationDTO.setVacancyId(vacancyId);

        JobApplicationDTO createdApplication = applicationService.submitApplication(applicationDTO, cvFile, certificateFile);
        ApiResponseDTO<JobApplicationDTO> response = new ApiResponseDTO<>(
                true,
                "Application submitted successfully",
                createdApplication
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all applications (Admin only)
     */
    @GetMapping
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<JobApplicationDTO>>> getAllApplications() {
        List<JobApplicationDTO> applications = applicationService.getAllApplications();
        ApiResponseDTO<List<JobApplicationDTO>> response = new ApiResponseDTO<>(
                true,
                "All applications retrieved successfully",
                applications
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get applications by vacancy ID (Admin only)
     */
    @GetMapping("/vacancy/{vacancyId}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<JobApplicationDTO>>> getApplicationsByVacancy(
            @PathVariable Long vacancyId) {
        List<JobApplicationDTO> applications = applicationService.getApplicationsByVacancy(vacancyId);
        ApiResponseDTO<List<JobApplicationDTO>> response = new ApiResponseDTO<>(
                true,
                "Applications for vacancy retrieved successfully",
                applications
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get applications by vacancy and status (Admin only)
     */
    @GetMapping("/vacancy/{vacancyId}/status/{status}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<JobApplicationDTO>>> getApplicationsByVacancyAndStatus(
            @PathVariable Long vacancyId,
            @PathVariable String status) {
        List<JobApplicationDTO> applications = applicationService.getApplicationsByVacancyAndStatus(vacancyId, status);
        ApiResponseDTO<List<JobApplicationDTO>> response = new ApiResponseDTO<>(
                true,
                "Applications with status retrieved successfully",
                applications
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get application by ID (Admin only)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<JobApplicationDTO>> getApplicationById(@PathVariable Long id) {
        JobApplicationDTO application = applicationService.getApplicationById(id);
        ApiResponseDTO<JobApplicationDTO> response = new ApiResponseDTO<>(
                true,
                "Application retrieved successfully",
                application
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Update application status (Admin only)
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<JobApplicationDTO>> updateApplicationStatus(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationStatusUpdateDTO statusDTO) {
        JobApplicationDTO updatedApplication = applicationService.updateApplicationStatus(id, statusDTO);
        ApiResponseDTO<JobApplicationDTO> response = new ApiResponseDTO<>(
                true,
                "Application status updated successfully",
                updatedApplication
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Send interview invitation email (Admin only)
     */
    @PostMapping("/{id}/send-interview-email")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<JobApplicationDTO>> sendInterviewInvitation(
            @PathVariable Long id,
            @Valid @RequestBody InterviewEmailDTO interviewDTO) {
        JobApplicationDTO updatedApplication = applicationService.sendInterviewInvitation(id, interviewDTO);
        ApiResponseDTO<JobApplicationDTO> response = new ApiResponseDTO<>(
                true,
                "Interview invitation sent successfully and application status updated",
                updatedApplication
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Shortlist application (Admin only)
     */
    @PutMapping("/{id}/shortlist")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<JobApplicationDTO>> shortlistApplication(@PathVariable Long id) {
        JobApplicationDTO shortlistedApplication = applicationService.shortlistApplication(id);
        ApiResponseDTO<JobApplicationDTO> response = new ApiResponseDTO<>(
                true,
                "Application shortlisted successfully",
                shortlistedApplication
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Reject application (Admin only)
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<JobApplicationDTO>> rejectApplication(@PathVariable Long id) {
        JobApplicationDTO rejectedApplication = applicationService.rejectApplication(id);
        ApiResponseDTO<JobApplicationDTO> response = new ApiResponseDTO<>(
                true,
                "Application rejected and rejection email sent successfully",
                rejectedApplication
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Delete application (Admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<Object>> deleteApplication(@PathVariable Long id) {
        applicationService.deleteApplication(id);
        ApiResponseDTO<Object> response = new ApiResponseDTO<>(true, "Application deleted successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Get application count by vacancy (Admin only)
     */
    @GetMapping("/count/vacancy/{vacancyId}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<Object>> getApplicationCountByVacancy(@PathVariable Long vacancyId) {
        long count = applicationService.getApplicationCountByVacancy(vacancyId);
        ApiResponseDTO<Object> response = new ApiResponseDTO<>(
                true,
                "Application count retrieved successfully",
                count
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get application count by status (Admin only)
     */
    @GetMapping("/count/status/{status}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<Object>> getApplicationCountByStatus(@PathVariable String status) {
        long count = applicationService.getApplicationCountByStatus(status);
        ApiResponseDTO<Object> response = new ApiResponseDTO<>(
                true,
                "Application count by status retrieved successfully",
                count
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get CV list (Operational manager/admin)
     */
    @GetMapping("/cvs")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<JobApplicationDTO>>> getCVList() {
        List<JobApplicationDTO> list = applicationService.getCVList();
        ApiResponseDTO<List<JobApplicationDTO>> response = new ApiResponseDTO<>(
                true,
                "CV list retrieved successfully",
                list
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get interviewees for director/executive (applications with interview scheduled)
     */
    @GetMapping("/interviewees")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('EXECUTIVE')")
    public ResponseEntity<ApiResponseDTO<List<JobApplicationDTO>>> getInterviewees() {
        List<JobApplicationDTO> list = applicationService.getInterviewList();
        ApiResponseDTO<List<JobApplicationDTO>> response = new ApiResponseDTO<>(
                true,
                "Interviewees retrieved successfully",
                list
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Mark an application selected (Director/Executive)
     */
    @PutMapping("/{id}/select")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('EXECUTIVE')")
    public ResponseEntity<ApiResponseDTO<JobApplicationDTO>> selectApplication(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reportDate = (body != null) ? body.get("reportDate") : null;
        String description = (body != null) ? body.get("description") : null;
        JobApplicationDTO dto = applicationService.selectApplication(id, reportDate, description);
        ApiResponseDTO<JobApplicationDTO> response = new ApiResponseDTO<>(
                true,
                "Application marked as selected",
                dto
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get selected applications (Operational manager/admin)
     */
    @GetMapping("/selected")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<JobApplicationDTO>>> getSelectedApplications() {
        List<JobApplicationDTO> list = applicationService.getSelectedApplications();
        ApiResponseDTO<List<JobApplicationDTO>> response = new ApiResponseDTO<>(
                true,
                "Selected applications retrieved successfully",
                list
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Download / view the CV file for a specific application
     */
    @GetMapping("/{id}/cv")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('EXECUTIVE')")
    public ResponseEntity<Resource> downloadApplicationCv(@PathVariable Long id) {
        try {
            JobApplication application = jobApplicationRepository.findById(id).orElse(null);
            if (application == null || application.getCvFilePath() == null || application.getCvFilePath().isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Path filePath = Paths.get(application.getCvFilePath()).toAbsolutePath();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = "application/octet-stream";
            String filename = filePath.getFileName().toString();
            if (filename.endsWith(".pdf")) contentType = "application/pdf";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download / view the certificate file for a specific application
     */
    @GetMapping("/{id}/certificate")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('EXECUTIVE')")
    public ResponseEntity<Resource> downloadApplicationCertificate(@PathVariable Long id) {
        try {
            JobApplication application = jobApplicationRepository.findById(id).orElse(null);
            if (application == null || application.getCertificateFilePath() == null || application.getCertificateFilePath().isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Path filePath = Paths.get(application.getCertificateFilePath()).toAbsolutePath();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = "application/octet-stream";
            String filename = filePath.getFileName().toString();
            if (filename.endsWith(".pdf")) contentType = "application/pdf";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
