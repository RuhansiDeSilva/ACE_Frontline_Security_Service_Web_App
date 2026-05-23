package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.CvSubmissionDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponseDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.CvSubmission;
import com.security.Ace.Front.Line.Security.Solutions.service.CvSubmissionService;
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

import jakarta.validation.constraints.NotNull;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/cv-submissions")
@Validated
public class CvSubmissionController {

    @Autowired
    private CvSubmissionService cvSubmissionService;

    /**
     * Public endpoint – submit a CV
     */
    @PostMapping("/submit")
    public ResponseEntity<ApiResponseDTO<CvSubmissionDTO>> submitCv(
            @NotNull(message = "Full name is required") @RequestParam String fullName,
            @NotNull(message = "Email is required") @RequestParam String email,
            @NotNull(message = "Phone number is required") @RequestParam String phoneNumber,
            @NotNull(message = "CV file is required") @RequestParam("cvFile") MultipartFile cvFile) {

        CvSubmissionDTO dto = cvSubmissionService.submitCv(fullName, email, phoneNumber, cvFile);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponseDTO<>(true, "CV submitted successfully", dto));
    }

    /**
     * Authenticated endpoint – list all CV submissions
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATIONAL_MANAGER','DIRECTOR','EXECUTIVE')")
    public ResponseEntity<ApiResponseDTO<List<CvSubmissionDTO>>> getAllSubmissions() {
        List<CvSubmissionDTO> list = cvSubmissionService.getAllSubmissions();
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "CV submissions retrieved", list));
    }

    /**
     * Authenticated endpoint – download/view a submitted CV file
     */
    @GetMapping("/{id}/cv")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATIONAL_MANAGER','DIRECTOR','EXECUTIVE')")
    public ResponseEntity<Resource> downloadCv(@PathVariable Long id) {
        try {
            CvSubmission submission = cvSubmissionService.getSubmissionEntity(id);
            if (submission == null || submission.getCvFilePath() == null) {
                return ResponseEntity.notFound().build();
            }

            Path filePath = Paths.get(submission.getCvFilePath()).toAbsolutePath();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = "application/octet-stream";
            String filename = filePath.getFileName().toString();
            if (filename.endsWith(".pdf")) {
                contentType = "application/pdf";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Select a CV submission candidate
     */
    @PutMapping("/{id}/select")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('EXECUTIVE')")
    public ResponseEntity<ApiResponseDTO<CvSubmissionDTO>> selectCvSubmission(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reportDate = (body != null) ? body.get("reportDate") : null;
        String description = (body != null) ? body.get("description") : null;
        CvSubmissionDTO dto = cvSubmissionService.selectCvSubmission(id, reportDate, description);
        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "CV submission marked as selected",
                dto
        ));
    }
}
