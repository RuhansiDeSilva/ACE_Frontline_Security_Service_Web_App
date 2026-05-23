package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.NotificationDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Notification;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.NotificationRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(Long recipientId, String message) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        createNotification(recipient, message);
    }

    @Transactional
    public void createNotification(User recipient, String message) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(message)
                .read(false)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyUser(Long userId, String message) {
        createNotification(userId, message);
    }

    @Transactional
    public void notifyRole(String role, String message) {
        List<User> users = userRepository.findByRole(role);
        notifyUsers(users, message);
    }

    @Transactional
    public void notifyRoles(Collection<String> roles, String message) {
        if (roles == null || roles.isEmpty()) return;
        List<User> users = userRepository.findByRoleIn(new java.util.ArrayList<>(roles));
        Map<Long, User> unique = new LinkedHashMap<>();
        for (User user : users) {
            unique.putIfAbsent(user.getId(), user);
        }
        notifyUsers(unique.values().stream().toList(), message);
    }

    @Transactional
    public void notifyUsers(List<User> users, String message) {
        if (users == null || users.isEmpty()) return;
        for (User user : users) {
            createNotification(user, message);
        }
    }


    public List<NotificationDTO> getMyNotifications(Long userId) {
        return notificationRepository.findByRecipient_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("You can only access your own notifications");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
