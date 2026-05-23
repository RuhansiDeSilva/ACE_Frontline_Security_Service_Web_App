package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    List<Interview> findByVacancyId(Long vacancyId);

    List<Interview> findByVacancyIdIsNull();

    List<Interview> findAllByOrderByInterviewDateDescInterviewTimeDesc();

    List<Interview> findByInterviewDate(LocalDate interviewDate);

    Optional<Interview> findByVacancyIdAndInterviewDateAndInterviewTimeAndInterviewLocation(
            Long vacancyId, LocalDate interviewDate, LocalTime interviewTime, String interviewLocation);

    Optional<Interview> findByVacancyIdIsNullAndInterviewDateAndInterviewTimeAndInterviewLocation(
            LocalDate interviewDate, LocalTime interviewTime, String interviewLocation);
}
