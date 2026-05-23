package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.JobVacancyDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy.VacancyStatus;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobVacancyRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobApplicationRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.InterviewRepository;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VacancyService {

    @Autowired
    private JobVacancyRepository vacancyRepository;

    @Autowired
    private JobApplicationRepository applicationRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Get all open vacancies for public display.
     */
    public List<JobVacancyDTO> getPublicVacancies() {
        List<JobVacancy> vacancies = vacancyRepository.findByStatus(VacancyStatus.OPEN);
        return vacancies.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Get open vacancies by location for public display
     */
    public List<JobVacancyDTO> getPublicVacanciesByLocation(String location) {
        List<JobVacancy> vacancies = vacancyRepository.findByStatusAndLocationIgnoreCase(VacancyStatus.OPEN, location);
        return vacancies.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Get open vacancies by experience level for public display
     */
    public List<JobVacancyDTO> getPublicVacanciesByExperienceLevel(String experienceLevel) {
        List<JobVacancy> vacancies = vacancyRepository.findByStatusAndExperienceLevel(VacancyStatus.OPEN,
                experienceLevel);
        return vacancies.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Get all vacancies for admin
     */
    public List<JobVacancyDTO> getAllVacancies() {
        List<JobVacancy> vacancies = vacancyRepository.findAll();
        return vacancies.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Get vacancy by ID
     */
    public JobVacancyDTO getVacancyById(Long id) {
        JobVacancy vacancy = vacancyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vacancy not found with id: " + id));
        return convertToDTO(vacancy);
    }

    /**
     * Create a new vacancy (Admin only)
     */
    @Transactional
    public JobVacancyDTO createVacancy(JobVacancyDTO vacancyDTO) {
        // Salary fields may be null when the UI does not supply them; default to zero
        Double minSalary = vacancyDTO.getMinSalary() != null ? vacancyDTO.getMinSalary() : 0.0;
        Double maxSalary = vacancyDTO.getMaxSalary() != null ? vacancyDTO.getMaxSalary() : 0.0;
        if (maxSalary < minSalary) {
            throw new IllegalArgumentException("Max salary must be greater than or equal to min salary");
        }

        JobVacancy vacancy = new JobVacancy();
        vacancy.setJobTitle(vacancyDTO.getJobTitle());
        vacancy.setDescription(vacancyDTO.getDescription());
        vacancy.setRequirements(vacancyDTO.getRequirements());
        vacancy.setExperienceLevel(vacancyDTO.getExperienceLevel());
        vacancy.setLocation(vacancyDTO.getLocation());
        vacancy.setMinSalary(minSalary);
        vacancy.setMaxSalary(maxSalary);
        vacancy.setStatus(VacancyStatus.valueOf(vacancyDTO.getStatus().toUpperCase()));

        JobVacancy savedVacancy = vacancyRepository.save(vacancy);
        return convertToDTO(savedVacancy);
    }

    /**
     * Update an existing vacancy (Admin only)
     */
    @Transactional
    public JobVacancyDTO updateVacancy(Long id, JobVacancyDTO vacancyDTO) {
        JobVacancy vacancy = vacancyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vacancy not found with id: " + id));

        // Salary fields may be null when the UI does not supply them; default to zero
        Double minSalaryUpd = vacancyDTO.getMinSalary() != null ? vacancyDTO.getMinSalary() : 0.0;
        Double maxSalaryUpd = vacancyDTO.getMaxSalary() != null ? vacancyDTO.getMaxSalary() : 0.0;
        if (maxSalaryUpd < minSalaryUpd) {
            throw new IllegalArgumentException("Max salary must be greater than or equal to min salary");
        }

        vacancy.setJobTitle(vacancyDTO.getJobTitle());
        vacancy.setDescription(vacancyDTO.getDescription());
        vacancy.setRequirements(vacancyDTO.getRequirements());
        vacancy.setExperienceLevel(vacancyDTO.getExperienceLevel());
        vacancy.setLocation(vacancyDTO.getLocation());
        vacancy.setMinSalary(minSalaryUpd);
        vacancy.setMaxSalary(maxSalaryUpd);
        vacancy.setStatus(VacancyStatus.valueOf(vacancyDTO.getStatus().toUpperCase()));

        JobVacancy updatedVacancy = vacancyRepository.save(vacancy);
        return convertToDTO(updatedVacancy);
    }

    /**
     * Delete a vacancy (Admin only)
     */
    @Transactional
    public void deleteVacancy(Long id) {
        if (!vacancyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vacancy not found with id: " + id);
        }

        try {
            // Delete all related applications for this vacancy first (they reference interviews)
            var applications = applicationRepository.findByVacancyId(id);
            applicationRepository.deleteAll(applications);

            // Then delete all related interviews for this vacancy
            var interviews = interviewRepository.findByVacancyId(id);
            interviewRepository.deleteAll(interviews);

            // Finally delete the vacancy
            vacancyRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete vacancy: " + e.getMessage(), e);
        }
    }

    /**
     * Close a vacancy (Admin only)
     */
    @Transactional
    public JobVacancyDTO closeVacancy(Long id) {
        JobVacancy vacancy = vacancyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vacancy not found with id: " + id));
        vacancy.setStatus(VacancyStatus.CLOSED);
        JobVacancy updatedVacancy = vacancyRepository.save(vacancy);
        return convertToDTO(updatedVacancy);
    }

    /**
     * Convert JobVacancy entity to JobVacancyDTO
     */
    private JobVacancyDTO convertToDTO(JobVacancy vacancy) {
        JobVacancyDTO dto = new JobVacancyDTO();
        dto.setId(vacancy.getId());
        dto.setJobTitle(vacancy.getJobTitle());
        dto.setDescription(vacancy.getDescription());
        dto.setRequirements(vacancy.getRequirements());
        dto.setExperienceLevel(vacancy.getExperienceLevel());
        dto.setLocation(vacancy.getLocation());
        dto.setMinSalary(vacancy.getMinSalary());
        dto.setMaxSalary(vacancy.getMaxSalary());
        dto.setStatus(vacancy.getStatus().toString());
        dto.setCreatedAt(vacancy.getCreatedAt().format(formatter));
        dto.setUpdatedAt(vacancy.getUpdatedAt().format(formatter));
        return dto;
    }
}
