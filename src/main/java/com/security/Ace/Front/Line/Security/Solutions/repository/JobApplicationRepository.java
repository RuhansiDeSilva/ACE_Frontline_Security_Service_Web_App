package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.JobApplication;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobApplication.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    // Get all applications for a specific vacancy.
    List<JobApplication> findByVacancyId(Long vacancyId);

    // Get all applications by status
    List<JobApplication> findByApplicationStatus(ApplicationStatus status);

    // Get applications for a vacancy by status
    List<JobApplication> findByVacancyIdAndApplicationStatus(Long vacancyId, ApplicationStatus status);

    // Get applications by email
    List<JobApplication> findByEmail(String email);

    // Get applications by NIC
    Optional<JobApplication> findByNic(String nic);

    // Get applications by applicant email and vacancy ID
    Optional<JobApplication> findByEmailAndVacancyId(String email, Long vacancyId);

    // Get applications by applicant NIC and vacancy ID
    Optional<JobApplication> findByNicAndVacancyId(String nic, Long vacancyId);

    // Count applications for a vacancy
    long countByVacancyId(Long vacancyId);

    // Count applications by status
    long countByApplicationStatus(ApplicationStatus status);

    // Get applications by vacancy and status
    @Query("SELECT ja FROM JobApplication ja WHERE ja.vacancyId = :vacancyId AND ja.applicationStatus = :status")
    List<JobApplication> findApplicationsByVacancyAndStatus(@Param("vacancyId") Long vacancyId, @Param("status") ApplicationStatus status);

    // Get applications where interview has been scheduled
    List<JobApplication> findByInterviewDateTimeIsNotNull();
}
