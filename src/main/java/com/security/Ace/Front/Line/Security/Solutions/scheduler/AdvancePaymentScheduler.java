package com.security.Ace.Front.Line.Security.Solutions.scheduler;

import com.security.Ace.Front.Line.Security.Solutions.entity.AdvanceRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.Notification;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.repository.AdvanceRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AdvancePaymentScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AdvancePaymentScheduler.class);

    private final AdvanceRequestRepository advanceRequestRepository;
    private final NotificationRepository notificationRepository;

    public AdvancePaymentScheduler(AdvanceRequestRepository advanceRequestRepository, NotificationRepository notificationRepository) {
        this.advanceRequestRepository = advanceRequestRepository;
        this.notificationRepository = notificationRepository;
    }

    // Runs at 00:01 AM on the 25th day of every month
    @Scheduled(cron = "0 */5 * 25 * ?", zone = "Asia/Colombo")
    @Transactional
    public void processAdvancePayments() {
        logger.info("Starting scheduled task to process advance payments on the 25th.");
        List<AdvanceRequest> processingAdvances = advanceRequestRepository.findByStatus(RequestStatus.PROCESSING);

        if (processingAdvances.isEmpty()) {
            logger.info("No PROCESSING advances found.");
            return;
        }

        int count = 0;
        for (AdvanceRequest adv : processingAdvances) {
            adv.setStatus(RequestStatus.PAID);
            advanceRequestRepository.save(adv);

            Notification notification = Notification.builder()
                    .recipient(adv.getUser())
                    .message("Your advance request of LKR " + adv.getAmount() + " for " + adv.getForMonth() + " has been paid.")
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
            count++;
        }

        logger.info("Finished processing {} advance payments.", count);
    }
}


