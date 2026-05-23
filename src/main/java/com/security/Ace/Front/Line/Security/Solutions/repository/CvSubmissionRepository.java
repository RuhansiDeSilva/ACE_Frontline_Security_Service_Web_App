package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.CvSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CvSubmissionRepository extends JpaRepository<CvSubmission, Long> {

    List<CvSubmission> findAllByOrderBySubmittedDateDesc();

    List<CvSubmission> findByStatusOrderBySubmittedDateDesc(CvSubmission.CvStatus status);

    List<CvSubmission> findByStatusIn(List<CvSubmission.CvStatus> statuses);

    List<CvSubmission> findByInterviewDateTimeIsNotNull();
}
