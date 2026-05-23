package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.CvSubmissionDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.CvSubmission;
import com.security.Ace.Front.Line.Security.Solutions.repository.CvSubmissionRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.FileUploadUtil;
import com.security.Ace.Front.Line.Security.Solutions.util.FileUploadException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CvSubmissionService {

    @Autowired
    private CvSubmissionRepository cvSubmissionRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Submit a new CV (public)
     */
    public CvSubmissionDTO submitCv(String fullName, String email, String phoneNumber, MultipartFile cvFile) {
        // Upload file using existing utility
        String cvFilePath = null;
        if (cvFile != null && !cvFile.isEmpty()) {
            try {
                cvFilePath = FileUploadUtil.uploadCVFile(cvFile);
            } catch (FileUploadException e) {
                throw new RuntimeException("Failed to upload CV: " + e.getMessage(), e);
            }
        }

        CvSubmission submission = new CvSubmission();
        submission.setFullName(fullName);
        submission.setEmail(email);
        submission.setPhoneNumber(phoneNumber);
        submission.setCvFilePath(cvFilePath);

        CvSubmission saved = cvSubmissionRepository.save(submission);
        return toDTO(saved);
    }

    /**
     * Get all CV submissions (for ops manager) - includes all statuses
     */
    public List<CvSubmissionDTO> getAllSubmissions() {
        return cvSubmissionRepository.findAllByOrderBySubmittedDateDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a single submission by ID
     */
    public CvSubmission getSubmissionEntity(Long id) {
        return cvSubmissionRepository.findById(id).orElse(null);
    }

    /**
     * Select a CV submission candidate
     */
    public CvSubmissionDTO selectCvSubmission(Long id, String reportDate, String description) {
        CvSubmission submission = cvSubmissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CV Submission not found with id: " + id));

        submission.setStatus(CvSubmission.CvStatus.SELECTED);

        // Send selection email
        try {
            emailService.sendSelectionEmail(
                    submission.getEmail(),
                    submission.getFullName(),
                    "General Application",
                    reportDate,
                    description);
        } catch (Exception e) {
            System.err.println("Failed to send selection email to CV applicant: " + e.getMessage());
        }

        CvSubmission saved = cvSubmissionRepository.save(submission);
        return toDTO(saved);
    }

    private CvSubmissionDTO toDTO(CvSubmission entity) {
        CvSubmissionDTO dto = new CvSubmissionDTO();
        dto.setId(entity.getId());
        dto.setFullName(entity.getFullName());
        dto.setEmail(entity.getEmail());
        dto.setPhoneNumber(entity.getPhoneNumber());
        dto.setCvFilePath(entity.getCvFilePath());
        dto.setSubmittedDate(entity.getSubmittedDate() != null ? entity.getSubmittedDate().toString() : null);
        dto.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        return dto;
    }
}
