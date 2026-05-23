package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.GeneralInquiryDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ServiceInquiryDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.GeneralInquiry;
import com.security.Ace.Front.Line.Security.Solutions.entity.ServiceInquiry;
import com.security.Ace.Front.Line.Security.Solutions.entity.RequestHistory;
import com.security.Ace.Front.Line.Security.Solutions.repository.GeneralInquiryRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ServiceInquiryRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.RequestHistoryRepository;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InquiryService {

    @Autowired
    private ServiceInquiryRepository serviceInquiryRepository;

    @Autowired
    private GeneralInquiryRepository generalInquiryRepository;

    @Autowired
    private RequestHistoryRepository requestHistoryRepository;

    @Autowired
    private EmailService emailService;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ServiceInquiryDTO createServiceInquiry(ServiceInquiryDTO dto) {
        ServiceInquiry inquiry = new ServiceInquiry();
        inquiry.setCompanyName(dto.getCompanyName());
        inquiry.setContactPerson(dto.getContactPerson());
        inquiry.setEmail(dto.getEmail());
        inquiry.setPhoneNumber(dto.getPhoneNumber());
        inquiry.setCompanyAddress(dto.getCompanyAddress());
        inquiry.setNumberOfOfficers(dto.getNumberOfOfficers());
        inquiry.setServiceLocation(dto.getServiceLocation());
        inquiry.setServiceDuration(dto.getServiceDuration());
        inquiry.setAdditionalNotes(dto.getAdditionalNotes());
        inquiry.setOfficerRoles(dto.getOfficerRoles());

        ServiceInquiry saved = serviceInquiryRepository.save(inquiry);

        // Log history
        logHistory(saved.getId(), "SERVICE", "CREATED",
            "Service inquiry created for " + saved.getCompanyName());

        return convertServiceToDTO(saved);
    }

    public GeneralInquiryDTO createGeneralInquiry(GeneralInquiryDTO dto) {
        GeneralInquiry inquiry = new GeneralInquiry();
        inquiry.setFullName(dto.getFullName());
        inquiry.setEmail(dto.getEmail());
        inquiry.setPhoneNumber(dto.getPhoneNumber());
        inquiry.setSubject(dto.getSubject());
        inquiry.setMessage(dto.getMessage());

        GeneralInquiry saved = generalInquiryRepository.save(inquiry);

        // Log history
        logHistory(saved.getId(), "GENERAL", "CREATED",
            "General inquiry created from " + saved.getFullName());

        return convertGeneralToDTO(saved);
    }

    public List<ServiceInquiryDTO> getAllServiceInquiries() {
        return serviceInquiryRepository.findAll().stream().map(this::convertServiceToDTO).collect(Collectors.toList());
    }

    public List<GeneralInquiryDTO> getAllGeneralInquiries() {
        return generalInquiryRepository.findAll().stream().map(this::convertGeneralToDTO).collect(Collectors.toList());
    }

    /**
     * Reply to a general inquiry - sends email and records the reply
     */
    public GeneralInquiryDTO replyToGeneralInquiry(Long id, String replySubject, String replyBody) {
        GeneralInquiry inquiry = generalInquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("General inquiry not found with id: " + id));

        // Send reply email
        emailService.sendInquiryReplyEmail(
                inquiry.getEmail(),
                inquiry.getFullName(),
                inquiry.getSubject(),
                replyBody);

        // Update inquiry record
        inquiry.setReplied(true);
        inquiry.setRepliedAt(LocalDateTime.now());
        inquiry.setReplyMessage(replyBody);
        if ("NEW".equals(inquiry.getStatus())) {
            inquiry.setStatus("IN_PROGRESS");
        }

        GeneralInquiry saved = generalInquiryRepository.save(inquiry);

        // Log history
        logHistory(id, "GENERAL", "REPLIED",
            "Reply sent: " + replySubject);

        return convertGeneralToDTO(saved);
    }

    /**
     * Reply to a service inquiry - sends email and records the reply
     */
    public ServiceInquiryDTO replyToServiceInquiry(Long id, String replySubject, String replyBody) {
        ServiceInquiry inquiry = serviceInquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service inquiry not found with id: " + id));

        // Send reply email
        emailService.sendInquiryReplyEmail(
                inquiry.getEmail(),
                inquiry.getContactPerson(),
                "Service Inquiry from " + inquiry.getCompanyName(),
                replyBody);

        // Update inquiry record
        inquiry.setReplied(true);
        inquiry.setRepliedAt(LocalDateTime.now());
        inquiry.setReplyMessage(replyBody);
        if ("NEW".equals(inquiry.getStatus())) {
            inquiry.setStatus("IN_PROGRESS");
        }

        ServiceInquiry saved = serviceInquiryRepository.save(inquiry);

        // Log history
        logHistory(id, "SERVICE", "REPLIED",
            "Reply sent: " + replySubject);

        return convertServiceToDTO(saved);
    }

    /**
     * Update status of a general inquiry
     */
    public GeneralInquiryDTO updateGeneralInquiryStatus(Long id, String status) {
        GeneralInquiry inquiry = generalInquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("General inquiry not found with id: " + id));

        String oldStatus = inquiry.getStatus();
        inquiry.setStatus(status);
        GeneralInquiry saved = generalInquiryRepository.save(inquiry);

        // Log history
        logHistory(id, "GENERAL", "STATUS_CHANGED",
            "Status changed from " + oldStatus + " to " + status);

        return convertGeneralToDTO(saved);
    }

    /**
     * Update status of a service inquiry
     */
    public ServiceInquiryDTO updateServiceInquiryStatus(Long id, String status) {
        ServiceInquiry inquiry = serviceInquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service inquiry not found with id: " + id));

        String oldStatus = inquiry.getStatus();
        inquiry.setStatus(status);
        ServiceInquiry saved = serviceInquiryRepository.save(inquiry);

        // Log history
        logHistory(id, "SERVICE", "STATUS_CHANGED",
            "Status changed from " + oldStatus + " to " + status);

        return convertServiceToDTO(saved);
    }

    /**
     * Update document notes for a service inquiry
     */
    public ServiceInquiryDTO updateServiceDocumentNotes(Long id, String notes) {
        ServiceInquiry inquiry = serviceInquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service inquiry not found with id: " + id));
        inquiry.setDocumentNotes(notes);
        ServiceInquiry saved = serviceInquiryRepository.save(inquiry);

        // Log history
        logHistory(id, "SERVICE", "DOCUMENT_UPDATED",
            "Document notes updated");

        return convertServiceToDTO(saved);
    }

    /**
     * Send document to administration (director, executive, chairman)
     */
    public ServiceInquiryDTO sendToAdministration(Long id) {
        ServiceInquiry inquiry = serviceInquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service inquiry not found with id: " + id));
        inquiry.setSentToAdmin(true);
        ServiceInquiry saved = serviceInquiryRepository.save(inquiry);

        // Log history
        logHistory(id, "SERVICE", "SENT_TO_ADMIN",
            "Inquiry sent to administration (Director, Executive, Chairman)");

        return convertServiceToDTO(saved);
    }

    /**
     * Get all service inquiries sent to administration
     */
    public List<ServiceInquiryDTO> getAdminServiceInquiries() {
        return serviceInquiryRepository.findBySentToAdminTrue()
                .stream().map(this::convertServiceToDTO).collect(Collectors.toList());
    }

    /**
     * Get request history for an inquiry
     */
    public List<RequestHistory> getInquiryHistory(Long inquiryId, String inquiryType) {
        return requestHistoryRepository.findByInquiryIdAndInquiryTypeOrderByCreatedAtAsc(inquiryId, inquiryType);
    }

    /**
     * Get request history for an inquiry by inquiryId only
     */
    public List<RequestHistory> getInquiryHistoryById(Long inquiryId) {
        return requestHistoryRepository.findByInquiryIdOrderByCreatedAtAsc(inquiryId);
    }

    /**
     * Delete a general inquiry
     */
    public void deleteGeneralInquiry(Long id) {
        GeneralInquiry inquiry = generalInquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("General inquiry not found with id: " + id));

        generalInquiryRepository.deleteById(id);

        // Log history
        logHistory(id, "GENERAL", "CLOSED",
            "General inquiry deleted from " + inquiry.getFullName());
    }

    /**
     * Helper method to log history
     */
    private void logHistory(Long inquiryId, String inquiryType, String action, String description) {
        RequestHistory history = new RequestHistory();
        history.setInquiryId(inquiryId);
        history.setInquiryType(inquiryType);
        history.setAction(action);
        history.setDescription(description);
        history.setActionBy("SYSTEM");
        requestHistoryRepository.save(history);
    }

    private ServiceInquiryDTO convertServiceToDTO(ServiceInquiry inquiry) {
        ServiceInquiryDTO dto = new ServiceInquiryDTO();
        dto.setId(inquiry.getId());
        dto.setCompanyName(inquiry.getCompanyName());
        dto.setContactPerson(inquiry.getContactPerson());
        dto.setEmail(inquiry.getEmail());
        dto.setPhoneNumber(inquiry.getPhoneNumber());
        dto.setCompanyAddress(inquiry.getCompanyAddress());
        dto.setNumberOfOfficers(inquiry.getNumberOfOfficers());
        dto.setServiceLocation(inquiry.getServiceLocation());
        dto.setServiceDuration(inquiry.getServiceDuration());
        dto.setAdditionalNotes(inquiry.getAdditionalNotes());
        dto.setSubmittedDate(inquiry.getSubmittedDate().format(formatter));
        dto.setStatus(inquiry.getStatus() != null ? inquiry.getStatus() : "NEW");
        dto.setReplied(inquiry.getReplied() != null ? inquiry.getReplied() : false);
        if (inquiry.getRepliedAt() != null) {
            dto.setRepliedAt(inquiry.getRepliedAt().format(formatter));
        }
        dto.setReplyMessage(inquiry.getReplyMessage());
        dto.setDocumentNotes(inquiry.getDocumentNotes());
        dto.setSentToAdmin(inquiry.getSentToAdmin() != null ? inquiry.getSentToAdmin() : false);
        dto.setOfficerRoles(inquiry.getOfficerRoles());
        return dto;
    }

    private GeneralInquiryDTO convertGeneralToDTO(GeneralInquiry inquiry) {
        GeneralInquiryDTO dto = new GeneralInquiryDTO();
        dto.setId(inquiry.getId());
        dto.setFullName(inquiry.getFullName());
        dto.setEmail(inquiry.getEmail());
        dto.setPhoneNumber(inquiry.getPhoneNumber());
        dto.setSubject(inquiry.getSubject());
        dto.setMessage(inquiry.getMessage());
        dto.setSubmittedDate(inquiry.getSubmittedDate().format(formatter));
        dto.setStatus(inquiry.getStatus() != null ? inquiry.getStatus() : "NEW");
        dto.setReplied(inquiry.getReplied() != null ? inquiry.getReplied() : false);
        if (inquiry.getRepliedAt() != null) {
            dto.setRepliedAt(inquiry.getRepliedAt().format(formatter));
        }
        dto.setReplyMessage(inquiry.getReplyMessage());
        return dto;
    }
}