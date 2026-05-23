package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.BulkInterviewScheduleDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.InterviewDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Announcement;
import com.security.Ace.Front.Line.Security.Solutions.entity.CvSubmission;
import com.security.Ace.Front.Line.Security.Solutions.entity.Interview;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobApplication;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy;
import com.security.Ace.Front.Line.Security.Solutions.repository.AnnouncementRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.CvSubmissionRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.InterviewRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobApplicationRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobVacancyRepository;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InterviewService {

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private JobVacancyRepository vacancyRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private JobApplicationRepository applicationRepository;

    @Autowired
    private CvSubmissionRepository cvSubmissionRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Get all interviews with their applicants
     */
    public List<InterviewDTO> getAllInterviews() {
        List<InterviewDTO> result = new ArrayList<>();

        // Get all vacancy-based interviews
        List<Interview> interviews = interviewRepository.findAllByOrderByInterviewDateDescInterviewTimeDesc();
        result.addAll(interviews.stream().map(this::convertToDTO).collect(Collectors.toList()));

        // Get CV submissions with scheduled interviews (not linked to Interview entity)
        List<CvSubmission> cvSubmissions = cvSubmissionRepository.findByInterviewDateTimeIsNotNull();

        // Group CV submissions by date+time+location to create virtual interview
        // records
        Map<String, List<CvSubmission>> cvBySession = cvSubmissions.stream()
                .collect(Collectors.groupingBy(cv -> cv.getInterviewDateTime().toLocalDate().format(DATE_FMT) + "|" +
                        cv.getInterviewDateTime().toLocalTime().format(TIME_FMT) + "|" +
                        cv.getInterviewLocation()));

        for (Map.Entry<String, List<CvSubmission>> entry : cvBySession.entrySet()) {
            String[] parts = entry.getKey().split("\\|");
            String date = parts[0];
            String time = parts[1];
            String location = parts[2];

            // Check if there's already an interview record with same date/time/location
            boolean existsInResult = result.stream().anyMatch(dto -> dto.getInterviewDate().equals(date) &&
                    dto.getInterviewTime().equals(time) &&
                    dto.getInterviewLocation().equals(location));

            if (existsInResult) {
                // Add CV applicants to existing interview DTO
                for (InterviewDTO dto : result) {
                    if (dto.getInterviewDate().equals(date) &&
                            dto.getInterviewTime().equals(time) &&
                            dto.getInterviewLocation().equals(location)) {

                        List<InterviewDTO.CvApplicantDTO> cvApplicants = entry.getValue().stream()
                                .map(cv -> {
                                    InterviewDTO.CvApplicantDTO cvDto = new InterviewDTO.CvApplicantDTO();
                                    cvDto.setCvSubmissionId(cv.getId());
                                    cvDto.setFullName(cv.getFullName());
                                    cvDto.setEmail(cv.getEmail());
                                    cvDto.setPhoneNumber(cv.getPhoneNumber());
                                    cvDto.setStatus(cv.getStatus().toString());
                                    return cvDto;
                                })
                                .collect(Collectors.toList());
                        dto.setCvApplicants(cvApplicants);
                        break;
                    }
                }
            } else {
                // Create a new virtual interview DTO for CV submissions only
                InterviewDTO dto = new InterviewDTO();
                dto.setId(null); // No actual interview record
                dto.setVacancyId(null);
                dto.setVacancyTitle("CV Submissions");
                dto.setInterviewDate(date);
                dto.setInterviewTime(time);
                dto.setInterviewLocation(location);

                List<InterviewDTO.CvApplicantDTO> cvApplicants = entry.getValue().stream()
                        .map(cv -> {
                            InterviewDTO.CvApplicantDTO cvDto = new InterviewDTO.CvApplicantDTO();
                            cvDto.setCvSubmissionId(cv.getId());
                            cvDto.setFullName(cv.getFullName());
                            cvDto.setEmail(cv.getEmail());
                            cvDto.setPhoneNumber(cv.getPhoneNumber());
                            cvDto.setStatus(cv.getStatus().toString());
                            return cvDto;
                        })
                        .collect(Collectors.toList());
                dto.setCvApplicants(cvApplicants);

                // Look up interviewer roles from announcements
                LocalDate interviewDate = LocalDate.parse(date);
                LocalTime interviewTime = LocalTime.parse(time);
                List<Announcement> matchingAnnouncements = announcementRepository
                        .findByInterviewDateAndInterviewTimeAndInterviewLocation(interviewDate, interviewTime,
                                location);
                List<String> interviewerRoles = matchingAnnouncements.stream()
                        .map(Announcement::getTargetRole)
                        .distinct()
                        .collect(Collectors.toList());
                dto.setInterviewerRoles(interviewerRoles);

                result.add(dto);
            }
        }

        // Sort by date desc, time desc
        result.sort((a, b) -> {
            int dateCompare = b.getInterviewDate().compareTo(a.getInterviewDate());
            if (dateCompare != 0)
                return dateCompare;
            return b.getInterviewTime().compareTo(a.getInterviewTime());
        });

        return result;
    }

    /**
     * Get interviews by vacancy
     */
    public List<InterviewDTO> getInterviewsByVacancy(Long vacancyId) {
        List<Interview> interviews = interviewRepository.findByVacancyId(vacancyId);
        return interviews.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private InterviewDTO convertToDTO(Interview interview) {
        InterviewDTO dto = new InterviewDTO();
        dto.setId(interview.getId());
        dto.setVacancyId(interview.getVacancyId());
        dto.setInterviewDate(interview.getInterviewDate().format(DATE_FMT));
        dto.setInterviewTime(interview.getInterviewTime().format(TIME_FMT));
        dto.setInterviewLocation(interview.getInterviewLocation());
        if (interview.getCreatedAt() != null) {
            dto.setCreatedAt(interview.getCreatedAt().format(DATETIME_FMT));
        }

        // Resolve vacancy title
        if (interview.getJobVacancy() != null) {
            dto.setVacancyTitle(interview.getJobVacancy().getJobTitle());
        } else {
            vacancyRepository.findById(interview.getVacancyId())
                    .ifPresent(v -> dto.setVacancyTitle(v.getJobTitle()));
        }

        // Map applications to applicant DTOs
        List<InterviewDTO.InterviewApplicantDTO> applicants = interview.getApplications()
                .stream()
                .map(app -> {
                    InterviewDTO.InterviewApplicantDTO a = new InterviewDTO.InterviewApplicantDTO();
                    a.setApplicationId(app.getId());
                    a.setFullName(app.getFullName());
                    a.setEmail(app.getEmail());
                    a.setPhoneNumber(app.getPhoneNumber());
                    a.setApplicationStatus(app.getApplicationStatus().toString());
                    return a;
                })
                .collect(Collectors.toList());
        dto.setApplicants(applicants);

        // Look up interviewer roles from announcements matching this interview
        List<Announcement> matchingAnnouncements = announcementRepository
                .findByInterviewDateAndInterviewTimeAndInterviewLocation(
                        interview.getInterviewDate(), interview.getInterviewTime(), interview.getInterviewLocation());
        List<String> interviewerRoles = matchingAnnouncements.stream()
                .map(Announcement::getTargetRole)
                .distinct()
                .collect(Collectors.toList());
        dto.setInterviewerRoles(interviewerRoles);

        return dto;
    }

    /**
     * Schedule interviews in bulk — supports applicants from multiple vacancies.
     * Groups applications by vacancy, creates/finds an interview per vacancy,
     * sends invitation emails and returns created interview DTOs.
     */
    public List<InterviewDTO> scheduleBulk(BulkInterviewScheduleDTO dto) {
        LocalDate date = LocalDate.parse(dto.getInterviewDate());
        LocalTime time = LocalTime.parse(dto.getInterviewTime());
        LocalDateTime dateTime = LocalDateTime.of(date, time);
        String location = dto.getInterviewLocation();

        Set<Long> touchedInterviewIds = new LinkedHashSet<>();
        int totalScheduled = 0;
        Set<String> vacancyTitles = new LinkedHashSet<>();

        // Process Job Applications if any
        List<Long> applicationIds = dto.getApplicationIds();
        if (applicationIds != null && !applicationIds.isEmpty()) {
            List<JobApplication> apps = applicationRepository.findAllById(applicationIds);

            // Group by vacancyId
            Map<Long, List<JobApplication>> byVacancy = apps.stream()
                    .collect(Collectors.groupingBy(JobApplication::getVacancyId));

            for (Map.Entry<Long, List<JobApplication>> entry : byVacancy.entrySet()) {
                Long vacancyId = entry.getKey();
                List<JobApplication> vacApps = entry.getValue();

                // Resolve vacancy title for email
                String vacancyTitle = vacancyRepository.findById(vacancyId)
                        .map(JobVacancy::getJobTitle)
                        .orElse("the applied position");
                vacancyTitles.add(vacancyTitle);

                // Find or create interview record for this vacancy + date/time/location
                Interview interview = interviewRepository
                        .findByVacancyIdAndInterviewDateAndInterviewTimeAndInterviewLocation(
                                vacancyId, date, time, location)
                        .orElseGet(() -> {
                            Interview newInterview = new Interview();
                            newInterview.setVacancyId(vacancyId);
                            newInterview.setInterviewDate(date);
                            newInterview.setInterviewTime(time);
                            newInterview.setInterviewLocation(location);
                            return interviewRepository.save(newInterview);
                        });

                touchedInterviewIds.add(interview.getId());

                for (JobApplication app : vacApps) {
                    // Send email invitation
                    try {
                        emailService.sendInterviewInvitationEmail(
                                app.getEmail(),
                                app.getFullName(),
                                vacancyTitle,
                                dto.getInterviewDate(),
                                dto.getInterviewTime(),
                                location);
                    } catch (Exception e) {
                        // Log but don't fail the whole batch
                        System.err
                                .println("Failed to send interview email to " + app.getEmail() + ": " + e.getMessage());
                    }

                    // Update application
                    app.setApplicationStatus(JobApplication.ApplicationStatus.INTERVIEW_SENT);
                    app.setInterviewDateTime(dateTime);
                    app.setInterviewLocation(location);
                    app.setInterviewId(interview.getId());
                    applicationRepository.save(app);
                    totalScheduled++;
                }
            }
        }

        // Process CV Submissions if any (no Interview record needed, just send email
        // and update CV)
        List<Long> cvSubmissionIds = dto.getCvSubmissionIds();
        if (cvSubmissionIds != null && !cvSubmissionIds.isEmpty()) {
            List<CvSubmission> cvSubmissions = cvSubmissionRepository.findAllById(cvSubmissionIds);
            vacancyTitles.add("CV Submissions");

            for (CvSubmission cvSubmission : cvSubmissions) {
                // Send email invitation
                try {
                    emailService.sendInterviewInvitationEmail(
                            cvSubmission.getEmail(),
                            cvSubmission.getFullName(),
                            "General Application",
                            dto.getInterviewDate(),
                            dto.getInterviewTime(),
                            location);
                } catch (Exception e) {
                    // Log but don't fail the whole batch
                    System.err.println(
                            "Failed to send interview email to " + cvSubmission.getEmail() + ": " + e.getMessage());
                }

                // Update CV submission (no interview record, just store details directly)
                cvSubmission.setStatus(CvSubmission.CvStatus.INTERVIEW_SENT);
                cvSubmission.setInterviewDateTime(dateTime);
                cvSubmission.setInterviewLocation(location);
                cvSubmissionRepository.save(cvSubmission);
                totalScheduled++;
            }
        }

        // If nothing was processed, throw an error
        if (totalScheduled == 0) {
            throw new ResourceNotFoundException("No applications or CV submissions found for the given IDs");
        }

        if (dto.getInterviewerRoles() != null && !dto.getInterviewerRoles().isEmpty()) {
            String titleSummary = vacancyTitles.isEmpty()
                    ? "Interview"
                    : String.join(", ", vacancyTitles);
            String message = String.format(
                    "Interview scheduled: %s on %s at %s (%s). Candidates: %d.",
                    titleSummary, dto.getInterviewDate(), dto.getInterviewTime(), location, totalScheduled
            );
            notificationService.notifyRoles(mapInterviewerRoles(dto.getInterviewerRoles()), message);
        }

        // Return the interview DTOs for all touched interviews
        return touchedInterviewIds.stream()
                .map(id -> interviewRepository.findById(id).orElse(null))
                .filter(Objects::nonNull)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private Set<String> mapInterviewerRoles(List<String> roles) {
        Set<String> mapped = new LinkedHashSet<>();
        if (roles == null) return mapped;
        for (String role : roles) {
            if (role == null) continue;
            String normalized = role.trim().toUpperCase();
            switch (normalized) {
                case "ACCOUNTANT" -> {
                    mapped.add("ACCOUNT_EXECUTIVE");
                    mapped.add("ACCOUNTANT");
                }
                case "EXECUTIVE" -> {
                    mapped.add("EXECUTIVE_OFFICER");
                    mapped.add("EXECUTIVE");
                }
                default -> mapped.add(normalized);
            }
        }
        return mapped;
    }

    /**
     * Delete an interview by ID
     */
    public void deleteInterview(Long id) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));

        // Unlink applications from this interview before deleting
        for (JobApplication app : interview.getApplications()) {
            app.setInterviewId(null);
            app.setInterview(null);
            applicationRepository.save(app);
        }

        interviewRepository.delete(interview);
    }
}
