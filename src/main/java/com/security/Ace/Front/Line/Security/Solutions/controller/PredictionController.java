package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.PredictionRequestDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.PredictionResponseDTO;
import com.security.Ace.Front.Line.Security.Solutions.service.MLPredictionService;
import com.security.Ace.Front.Line.Security.Solutions.service.EmailService;
import com.security.Ace.Front.Line.Security.Solutions.service.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ml")
public class PredictionController {

    private final MLPredictionService mlPredictionService;
    private final PdfService pdfService;
    private final EmailService emailService;

    @Autowired
    public PredictionController(MLPredictionService mlPredictionService, PdfService pdfService,
            EmailService emailService) {
        this.mlPredictionService = mlPredictionService;
        this.pdfService = pdfService;
        this.emailService = emailService;
    }

    @PostMapping("/predict")
    public PredictionResponseDTO predict(@RequestBody PredictionRequestDTO request) {
        return mlPredictionService.predictRisk(request);
    }

    @PostMapping("/report")
    public ResponseEntity<byte[]> generateReport(@RequestBody Map<String, Object> payload) {
        PredictionRequestDTO request = mapToRequestDTO((Map<String, Object>) payload.get("request"));
        PredictionResponseDTO response = mapToResponseDTO((Map<String, Object>) payload.get("response"));

        byte[] pdfBytes = pdfService.generateRiskAssessmentPdf(request, response);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=AI_Risk_Assessment.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @PostMapping("/report/email")
    public ResponseEntity<String> sendReportByEmail(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        PredictionRequestDTO request = mapToRequestDTO((Map<String, Object>) payload.get("request"));
        PredictionResponseDTO response = mapToResponseDTO((Map<String, Object>) payload.get("response"));

        byte[] pdfBytes = pdfService.generateRiskAssessmentPdf(request, response);
        emailService.sendRiskAssessmentEmail(email, request.getCompanyName(), pdfBytes);

        return ResponseEntity.ok("Email sent successfully");
    }

    // Helper methods for mapping
    private PredictionRequestDTO mapToRequestDTO(Map<String, Object> data) {
        PredictionRequestDTO dto = new PredictionRequestDTO();
        dto.setCompanyName((String) data.get("company_name"));
        dto.setEmployeeCount((Integer) data.get("employee_count"));
        dto.setRequiredOfficers((Integer) data.get("required_officers"));
        dto.setDistanceToCityKm(((Number) data.get("distance_to_city_km")).doubleValue());
        dto.setCompanyAssets(((Number) data.get("company_assets")).doubleValue());
        dto.setCctvCount((Integer) data.get("cctv_count"));
        dto.setCompanyType((String) data.get("company_type"));
        dto.setUrbanRural((String) data.get("urban_rural"));
        dto.setNightActivity((Boolean) data.get("night_activity"));
        dto.setNearestCity((String) data.get("nearest_city"));
        dto.setMajorEventNearby((Boolean) data.get("major_event_nearby"));
        dto.setCashHandling((Boolean) data.get("cash_handling"));
        return dto;
    }

    private PredictionResponseDTO mapToResponseDTO(Map<String, Object> data) {
        PredictionResponseDTO dto = new PredictionResponseDTO();
        dto.setRiskLevel((String) data.get("risk_level"));
        dto.setOfficerCount((Integer) data.get("officer_count"));
        return dto;
    }
}
