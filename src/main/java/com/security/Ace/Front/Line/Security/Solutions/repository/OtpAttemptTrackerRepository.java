package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.OtpAttemptTracker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpAttemptTrackerRepository extends JpaRepository<OtpAttemptTracker, Long> {

    Optional<OtpAttemptTracker> findByEmail(String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM OtpAttemptTracker o WHERE o.locked = false AND o.failedAttempts = 0 AND o.createdAt < :cutoffTime")
    void deleteOldSuccessfulAttempts(LocalDateTime cutoffTime);
}
