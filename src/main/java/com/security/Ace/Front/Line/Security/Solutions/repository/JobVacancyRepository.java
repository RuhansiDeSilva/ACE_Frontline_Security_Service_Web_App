package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy.VacancyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobVacancyRepository extends JpaRepository<JobVacancy, Long> {

    // Get all open vacancies for public display.
    List<JobVacancy> findByStatus(VacancyStatus status);

    // Get vacancies by experience level
    List<JobVacancy> findByExperienceLevel(String experienceLevel);

    // Get vacancies by location
    List<JobVacancy> findByLocation(String location);

    // Search vacancies by title
    List<JobVacancy> findByJobTitleContainingIgnoreCase(String jobTitle);

    // Get open vacancies by location
    List<JobVacancy> findByStatusAndLocationIgnoreCase(VacancyStatus status, String location);

    // Get open vacancies by experience level
    List<JobVacancy> findByStatusAndExperienceLevel(VacancyStatus status, String experienceLevel);

    // Check if vacancy exists
    boolean existsById(Long id);
}
