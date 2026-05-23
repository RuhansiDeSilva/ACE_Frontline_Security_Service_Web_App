package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.JobApplicationDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.InterviewEmailDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApplicationStatusUpdateDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobApplication;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobApplication.ApplicationStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy;
import com.security.Ace.Front.Line.Security.Solutions.entity.Interview;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobApplicationRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobVacancyRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.InterviewRepository;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.util.FileUploadUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    @Autowired
    private JobApplicationRepository applicationRepository;

    @Autowired
    private JobVacancyRepository vacancyRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private InterviewRepository interviewRepository;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Submit a new job application
     */
    public JobApplicationDTO submitApplication(JobApplicationDTO applicationDTO, MultipartFile cvFile,
            MultipartFile certificateFile) {
        // Validate vacancy exists
        JobVacancy vacancy = vacancyRepository.findById(applicationDTO.getVacancyId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vacancy not found with id: " + applicationDTO.getVacancyId()));

        // Check if application already exists for this NIC and vacancy
        if (applicationRepository.findByNicAndVacancyId(applicationDTO.getNic(), applicationDTO.getVacancyId())
                .isPresent()) {
            throw new IllegalArgumentException("You have already applied for this position with this NIC");
        }

        // Upload files
        String cvPath = FileUploadUtil.uploadCVFile(cvFile);
        applicationDTO.setCvFilePath(cvPath);
        String certificatePath = null;
        if (certificateFile != null && !certificateFile.isEmpty()) {
            certificatePath = FileUploadUtil.uploadCertificateFile(certificateFile);
        }

        // Create application
        JobApplication application = new JobApplication();
        application.setFullName(applicationDTO.getFullName());
        application.setNic(applicationDTO.getNic());
        application.setEmail(applicationDTO.getEmail());
        application.setPhoneNumber(applicationDTO.getPhoneNumber());
        application.setAddress(applicationDTO.getAddress());
        application.setExperience(applicationDTO.getExperience());
        application.setCvFilePath(cvPath);
        // ensure non-null value to satisfy schema (nullable column allows null too)
        application.setCertificateFilePath(certificatePath != null ? certificatePath : "");
        application.setApplicationStatus(ApplicationStatus.PENDING);
        application.setVacancyId(applicationDTO.getVacancyId());

        JobApplication savedApplication = applicationRepository.save(application);
        return convertToDTO(savedApplication);
    }

    /**
     * Get all applications (Admin only)
     */
    public List<JobApplicationDTO> getAllApplications() {
        List<JobApplication> applications = applicationRepository.findAll();
        return applications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Get applications for a specific vacancy (Admin only)
     */
    public List<JobApplicationDTO> getApplicationsByVacancy(Long vacancyId) {
        if (!vacancyRepository.existsById(vacancyId)) {
            throw new ResourceNotFoundException("Vacancy not found with id: " + vacancyId);
        }
        List<JobApplication> applications = applicationRepository.findByVacancyId(vacancyId);
        return applications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Get applications by status and vacancy (Admin only)
     */
    public List<JobApplicationDTO> getApplicationsByVacancyAndStatus(Long vacancyId, String status) {
        if (!vacancyRepository.existsById(vacancyId)) {
            throw new ResourceNotFoundException("Vacancy not found with id: " + vacancyId);
        }
        ApplicationStatus appStatus = ApplicationStatus.valueOf(status.toUpperCase());
        List<JobApplication> applications = applicationRepository.findByVacancyIdAndApplicationStatus(vacancyId,
                appStatus);
        return applications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // new helper methods for listing

    public List<JobApplicationDTO> getAllApplicationsForManager() {
        return getAllApplications();
    }

    public List<JobApplicationDTO> getApplicationsForDirectorOrExec() {
        return getInterviewList();
    }

    /**
     * Get application by ID (Admin only)
     */
    public JobApplicationDTO getApplicationById(Long id) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));
        return convertToDTO(application);
    }

    /**
     * Update application status (Admin only)
     */
    public JobApplicationDTO updateApplicationStatus(Long id, ApplicationStatusUpdateDTO statusDTO) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));

        ApplicationStatus newStatus = ApplicationStatus.valueOf(statusDTO.getStatus().toUpperCase());
        application.setApplicationStatus(newStatus);

        JobApplication updatedApplication = applicationRepository.save(application);
        return convertToDTO(updatedApplication);
    }

    /**
     * Send interview invitation email and record details (Admin only)
     */
    public JobApplicationDTO sendInterviewInvitation(Long id, InterviewEmailDTO interviewDTO) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));

        // Get vacancy details
        JobVacancy vacancy = vacancyRepository.findById(application.getVacancyId())
                .orElseThrow(() -> new ResourceNotFoundException("Vacancy not found"));

        // Send email
        emailService.sendInterviewInvitationEmail(
                application.getEmail(),
                application.getFullName(),
                vacancy.getJobTitle(),
                interviewDTO.getInterviewDate(),
                interviewDTO.getInterviewTime(),
                interviewDTO.getInterviewLocation());

        // Parse date and time
        LocalDate date = LocalDate.parse(interviewDTO.getInterviewDate());
        LocalTime time = LocalTime.parse(interviewDTO.getInterviewTime());
        LocalDateTime dateTime = LocalDateTime.of(date, time);

        // Find existing interview with same vacancy/date/time/location, or create new
        // one
        Interview savedInterview = interviewRepository
                .findByVacancyIdAndInterviewDateAndInterviewTimeAndInterviewLocation(
                        application.getVacancyId(), date, time, interviewDTO.getInterviewLocation())
                .orElseGet(() -> {
                    Interview newInterview = new Interview();
                    newInterview.setVacancyId(application.getVacancyId());
                    newInterview.setInterviewDate(date);
                    newInterview.setInterviewTime(time);
                    newInterview.setInterviewLocation(interviewDTO.getInterviewLocation());
                    return interviewRepository.save(newInterview);
                });

        // Update application with interview details and status
        application.setApplicationStatus(ApplicationStatus.INTERVIEW_SENT);
        application.setInterviewDateTime(dateTime);
        application.setInterviewLocation(interviewDTO.getInterviewLocation());
        application.setInterviewId(savedInterview.getId());

        JobApplication updatedApplication = applicationRepository.save(application);

        return convertToDTO(updatedApplication);
    }

    /**
     * Shortlist application (Admin only)
     */
    public JobApplicationDTO shortlistApplication(Long id) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));

        application.setApplicationStatus(ApplicationStatus.SHORTLISTED);
        JobApplication updatedApplication = applicationRepository.save(application);

        return convertToDTO(updatedApplication);
    }

    /**
     * Mark application as selected (Director/Executive)
     */
    public JobApplicationDTO selectApplication(Long id, String reportDate, String description) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));
        application.setApplicationStatus(ApplicationStatus.SELECTED);

        String vacancyTitle = vacancyRepository.findById(application.getVacancyId())
                .map(JobVacancy::getJobTitle)
                .orElse("the applied position");

        // Send selection email to the applicant
        try {
            emailService.sendSelectionEmail(
                    application.getEmail(),
                    application.getFullName(),
                    vacancyTitle,
                    reportDate,
                    description);
        } catch (Exception e) {
            System.err.println("Failed to send selection email to applicant: " + e.getMessage());
        }

        JobApplication updatedApplication = applicationRepository.save(application);
        return convertToDTO(updatedApplication);
    }

    /**
     * Get list of interviewees (applications with interview scheduled)
     */
    public List<JobApplicationDTO> getInterviewList() {
        List<JobApplication> applications = applicationRepository.findByInterviewDateTimeIsNotNull();
        return applications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Get list of selected applications
     */
    public List<JobApplicationDTO> getSelectedApplications() {
        List<JobApplication> applications = applicationRepository.findByApplicationStatus(ApplicationStatus.SELECTED);
        return applications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Get CV list for operational manager (all applications with job title
     * included)
     */
    public List<JobApplicationDTO> getCVList() {
        List<JobApplication> applications = applicationRepository.findAll();
        return applications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Reject application (Admin only)
     */
    public JobApplicationDTO rejectApplication(Long id) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));

        JobVacancy vacancy = vacancyRepository.findById(application.getVacancyId())
                .orElseThrow(() -> new ResourceNotFoundException("Vacancy not found"));

        // Send rejection email
        emailService.sendRejectionEmail(application.getEmail(), application.getFullName(), vacancy.getJobTitle());

        application.setApplicationStatus(ApplicationStatus.REJECTED);
        JobApplication updatedApplication = applicationRepository.save(application);

        return convertToDTO(updatedApplication);
    }

    /**
     * Delete application (Admin only)
     */
    public void deleteApplication(Long id) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));

        // Delete uploaded files
        FileUploadUtil.deleteFile(application.getCvFilePath());
        FileUploadUtil.deleteFile(application.getCertificateFilePath());

        applicationRepository.deleteById(id);
    }

    /**
     * Get application statistics by vacancy
     */
    public long getApplicationCountByVacancy(Long vacancyId) {
        return applicationRepository.countByVacancyId(vacancyId);
    }

    /**
     * Get application statistics by status
     */
    public long getApplicationCountByStatus(String status) {
        ApplicationStatus appStatus = ApplicationStatus.valueOf(status.toUpperCase());
        return applicationRepository.countByApplicationStatus(appStatus);
    }

    /**
     * Convert JobApplication entity to JobApplicationDTO
     */
    private JobApplicationDTO convertToDTO(JobApplication application) {
        JobApplicationDTO dto = new JobApplicationDTO();
        dto.setId(application.getId());
        dto.setFullName(application.getFullName());
        dto.setNic(application.getNic());
        dto.setEmail(application.getEmail());
        dto.setPhoneNumber(application.getPhoneNumber());
        dto.setAddress(application.getAddress());
        dto.setExperience(application.getExperience());
        dto.setCvFilePath(application.getCvFilePath());
        dto.setCertificateFilePath(application.getCertificateFilePath());
        dto.setApplicationStatus(application.getApplicationStatus().toString());
        dto.setAppliedDate(application.getAppliedDate().format(formatter));
        dto.setUpdatedDate(application.getUpdatedDate().format(formatter));
        dto.setVacancyId(application.getVacancyId());
        // try to include vacancy title if loaded or fetch from repository
        if (application.getJobVacancy() != null) {
            dto.setVacancyTitle(application.getJobVacancy().getJobTitle());
        } else {
            vacancyRepository.findById(application.getVacancyId()).ifPresent(v -> dto.setVacancyTitle(v.getJobTitle()));
        }
        // include interview details if set
        if (application.getInterviewDateTime() != null) {
            dto.setInterviewDateTime(application.getInterviewDateTime().format(formatter));
        }
        dto.setInterviewLocation(application.getInterviewLocation());
        return dto;
    }
}
