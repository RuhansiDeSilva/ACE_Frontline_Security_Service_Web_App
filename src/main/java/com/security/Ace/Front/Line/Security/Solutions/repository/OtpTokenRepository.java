package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.OtpToken;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    Optional<OtpToken> findTopByUserAndUsedFalseOrderByCreatedAtDesc(User user);

    @Modifying
    @Transactional
    @Query("UPDATE OtpToken o SET o.used = true WHERE o.user = :user AND o.used = false")
    void invalidateAllUserOtps(User user);
}