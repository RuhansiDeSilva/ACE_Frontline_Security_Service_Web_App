package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Notification;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipient_IdOrderByCreatedAtDesc(Long recipientId);
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    List<Notification> findByRecipientAndReadOrderByCreatedAtDesc(User recipient, boolean read);
}
