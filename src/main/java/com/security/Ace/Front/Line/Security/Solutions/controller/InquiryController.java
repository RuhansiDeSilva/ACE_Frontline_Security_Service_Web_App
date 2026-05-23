package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.GeneralInquiryDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ServiceInquiryDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.InquiryReplyDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponseDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.RequestHistory;
import com.security.Ace.Front.Line.Security.Solutions.service.InquiryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inquiries")
@Validated
public class InquiryController {

    @Autowired
    private InquiryService inquiryService;

    /**
     * Public endpoint to create a service inquiry
     */
    @PostMapping("/service")
    public ResponseEntity<ApiResponseDTO<ServiceInquiryDTO>> createServiceInquiry(
            @Valid @RequestBody ServiceInquiryDTO dto) {
        ServiceInquiryDTO created = inquiryService.createServiceInquiry(dto);
        ApiResponseDTO<ServiceInquiryDTO> response = new ApiResponseDTO<>(
                true,
                "Service inquiry submitted successfully",
                created
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Public endpoint to create a general inquiry
     */
    @PostMapping("/general")
    public ResponseEntity<ApiResponseDTO<GeneralInquiryDTO>> createGeneralInquiry(
            @Valid @RequestBody GeneralInquiryDTO dto) {
        GeneralInquiryDTO created = inquiryService.createGeneralInquiry(dto);
        ApiResponseDTO<GeneralInquiryDTO> response = new ApiResponseDTO<>(
                true,
                "General inquiry submitted successfully",
                created
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all service inquiries (Operational manager / admin)
     */
    @GetMapping("/service")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<ServiceInquiryDTO>>> getServiceInquiries() {
        List<ServiceInquiryDTO> list = inquiryService.getAllServiceInquiries();
        ApiResponseDTO<List<ServiceInquiryDTO>> response = new ApiResponseDTO<>(
                true,
                "Service inquiries retrieved successfully",
                list
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get all general inquiries (Operational manager / admin)
     */
    @GetMapping("/general")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<GeneralInquiryDTO>>> getGeneralInquiries() {
        List<GeneralInquiryDTO> list = inquiryService.getAllGeneralInquiries();
        ApiResponseDTO<List<GeneralInquiryDTO>> response = new ApiResponseDTO<>(
                true,
                "General inquiries retrieved successfully",
                list
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Reply to a general inquiry (Operational manager / admin)
     */
    @PostMapping("/general/{id}/reply")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<GeneralInquiryDTO>> replyToGeneralInquiry(
            @PathVariable Long id,
            @Valid @RequestBody InquiryReplyDTO replyDTO) {
        GeneralInquiryDTO replied = inquiryService.replyToGeneralInquiry(id, replyDTO.getSubject(), replyDTO.getMessage());
        ApiResponseDTO<GeneralInquiryDTO> response = new ApiResponseDTO<>(
                true,
                "Reply sent successfully",
                replied
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Reply to a service inquiry (Operational manager / admin)
     */
    @PostMapping("/service/{id}/reply")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<ServiceInquiryDTO>> replyToServiceInquiry(
            @PathVariable Long id,
            @Valid @RequestBody InquiryReplyDTO replyDTO) {
        ServiceInquiryDTO replied = inquiryService.replyToServiceInquiry(id, replyDTO.getSubject(), replyDTO.getMessage());
        ApiResponseDTO<ServiceInquiryDTO> response = new ApiResponseDTO<>(
                true,
                "Reply sent successfully",
                replied
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Update status of a general inquiry
     */
    @PutMapping("/general/{id}/status")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<GeneralInquiryDTO>> updateGeneralStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        GeneralInquiryDTO updated = inquiryService.updateGeneralInquiryStatus(id, status);
        ApiResponseDTO<GeneralInquiryDTO> response = new ApiResponseDTO<>(
                true,
                "Status updated",
                updated
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Update status of a service inquiry
     */
    @PutMapping("/service/{id}/status")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<ServiceInquiryDTO>> updateServiceStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        ServiceInquiryDTO updated = inquiryService.updateServiceInquiryStatus(id, status);
        ApiResponseDTO<ServiceInquiryDTO> response = new ApiResponseDTO<>(
                true,
                "Status updated",
                updated
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Update document notes for a service inquiry
     */
    @PutMapping("/service/{id}/document")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<ServiceInquiryDTO>> updateServiceDocument(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String notes = body.get("notes");
        ServiceInquiryDTO updated = inquiryService.updateServiceDocumentNotes(id, notes);
        ApiResponseDTO<ServiceInquiryDTO> response = new ApiResponseDTO<>(
                true,
                "Document notes updated",
                updated
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Send a service inquiry document to administration (director, executive, chairman)
     */
    @PutMapping("/service/{id}/send-to-admin")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<ServiceInquiryDTO>> sendToAdmin(@PathVariable Long id) {
        ServiceInquiryDTO updated = inquiryService.sendToAdministration(id);
        ApiResponseDTO<ServiceInquiryDTO> response = new ApiResponseDTO<>(
                true,
                "Document sent to administration",
                updated
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get service inquiries sent to administration (for director, executive, chairman)
     */
    @GetMapping("/admin/service-documents")
    @PreAuthorize("hasRole('DIRECTOR') or hasRole('EXECUTIVE') or hasRole('EXECUTIVE_OFFICER') or hasRole('CHAIRMAN') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<ServiceInquiryDTO>>> getAdminServiceDocuments() {
        List<ServiceInquiryDTO> list = inquiryService.getAdminServiceInquiries();
        ApiResponseDTO<List<ServiceInquiryDTO>> response = new ApiResponseDTO<>(
                true,
                "Admin service documents retrieved",
                list
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get request history for an inquiry (Operational manager / admin)
     */
    @GetMapping("/{type}/{id}/history")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<List<RequestHistory>>> getInquiryHistory(
            @PathVariable String type,
            @PathVariable Long id) {
        List<RequestHistory> history = inquiryService.getInquiryHistory(id, type.toUpperCase());
        ApiResponseDTO<List<RequestHistory>> response = new ApiResponseDTO<>(
                true,
                "Request history retrieved successfully",
                history
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a general inquiry (Operational manager / admin)
     */
    @DeleteMapping("/general/{id}")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<String>> deleteGeneralInquiry(@PathVariable Long id) {
        inquiryService.deleteGeneralInquiry(id);
        ApiResponseDTO<String> response = new ApiResponseDTO<>(
                true,
                "General inquiry deleted successfully",
                null
        );
        return ResponseEntity.ok(response);
    }
}
