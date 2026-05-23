package com.security.Ace.Front.Line.Security.Solutions.controller;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import com.security.Ace.Front.Line.Security.Solutions.dto.FeedbackReplyRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.FeedbackRejectionRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.FeedbackResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.FeedbackSubmissionRequest;
import com.security.Ace.Front.Line.Security.Solutions.service.FeedbackService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FeedbackController.class);

    private final FeedbackService feedbackService;

    @PostMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<FeedbackResponse>> submitFeedback(
            @PathVariable Integer clientId,
            @Valid @RequestBody FeedbackSubmissionRequest request) {

        FeedbackResponse response = feedbackService.submitFeedback(clientId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Feedback submitted successfully", response));
    }

    @PutMapping("/{feedbackId}/approve")
    public ResponseEntity<ApiResponse<FeedbackResponse>> approveFeedback(
            @PathVariable Integer feedbackId,
            @RequestParam(defaultValue = "false") boolean displayOnHomepage) {

        FeedbackResponse response = feedbackService.approveFeedback(feedbackId, displayOnHomepage);
        return ResponseEntity.ok(ApiResponse.success("Feedback approved successfully", response));
    }

    @PutMapping("/{feedbackId}/reject")
    public ResponseEntity<ApiResponse<FeedbackResponse>> rejectFeedback(
            @PathVariable Integer feedbackId,
            @RequestBody(required = false) FeedbackRejectionRequest request) {

        String adminResponse = (request != null) ? request.getAdminResponse() : null;
        FeedbackResponse response = feedbackService.rejectFeedback(feedbackId, adminResponse);
        return ResponseEntity.ok(ApiResponse.success("Feedback rejected successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> getAllFeedback() {
        List<FeedbackResponse> feedbacks = feedbackService.getAllFeedback();
        return ResponseEntity.ok(ApiResponse.success("Feedbacks retrieved successfully", feedbacks));
    }

    @GetMapping("/{feedbackId}")
    public ResponseEntity<ApiResponse<FeedbackResponse>> getFeedbackById(@PathVariable Integer feedbackId) {
        FeedbackResponse feedback = feedbackService.getFeedbackById(feedbackId);
        return ResponseEntity.ok(ApiResponse.success("Feedback retrieved successfully", feedback));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> getFeedbackByClient(@PathVariable Integer clientId) {
        List<FeedbackResponse> feedbacks = feedbackService.getFeedbackByClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client feedbacks retrieved successfully", feedbacks));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> getPendingFeedback() {
        List<FeedbackResponse> feedbacks = feedbackService.getPendingFeedback();
        return ResponseEntity.ok(ApiResponse.success("Pending feedbacks retrieved successfully", feedbacks));
    }

    @GetMapping("/homepage")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> getHomepageFeedback() {
        List<FeedbackResponse> feedbacks = feedbackService.getApprovedForHomepage();
        return ResponseEntity.ok(ApiResponse.success("Homepage feedbacks retrieved successfully", feedbacks));
    }

    @GetMapping("/average-rating")
    public ResponseEntity<ApiResponse<Double>> getAverageRating() {
        Double avgRating = feedbackService.getAverageRating();
        return ResponseEntity.ok(ApiResponse.success("Average rating retrieved successfully", avgRating));
    }

    @PutMapping("/{feedbackId}/flag")
    public ResponseEntity<ApiResponse<FeedbackResponse>> flagFeedback(
            @PathVariable Integer feedbackId,
            @RequestBody(required = false) FeedbackRejectionRequest request) {

        String adminResponse = (request != null) ? request.getAdminResponse() : null;
        FeedbackResponse response = feedbackService.flagFeedback(feedbackId, adminResponse);
        return ResponseEntity.ok(ApiResponse.success("Feedback flagged successfully", response));
    }

    @PutMapping("/{feedbackId}/reply")
    public ResponseEntity<ApiResponse<FeedbackResponse>> replyToFeedback(
            @PathVariable Integer feedbackId,
            @Valid @RequestBody FeedbackReplyRequest request) {

        FeedbackResponse response = feedbackService.replyToFeedback(feedbackId, request.getReplyMessage());
        return ResponseEntity.ok(ApiResponse.success("Reply sent successfully", response));
    }

    @GetMapping("/approved")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> getApprovedFeedback() {
        List<FeedbackResponse> feedbacks = feedbackService.getApprovedFeedback();
        return ResponseEntity.ok(ApiResponse.success("Approved feedbacks retrieved successfully", feedbacks));
    }

    @GetMapping("/report")
    public ResponseEntity<byte[]> generateFeedbackReport() {
        byte[] pdf = feedbackService.generateFeedbackReportPdf();
        String filename = "feedback-report-" +
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }
}
