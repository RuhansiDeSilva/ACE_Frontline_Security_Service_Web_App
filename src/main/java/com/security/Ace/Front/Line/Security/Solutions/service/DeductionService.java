package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.DeductionApprovalStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.DeductionType;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.InvoiceStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.InvalidOperationException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeductionService {

    private final DeductionRepository deductionRepository;
    private final ClientRepository clientRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional
    public DeductionResponse createDeduction(DeductionRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", request.getClientId()));

        Deduction deduction = new Deduction();
        deduction.setClient(client);
        deduction.setDeductionType(DeductionType.valueOf(request.getDeductionType()));
        deduction.setAmount(request.getAmount());
        deduction.setIncidentDate(request.getIncidentDate());
        deduction.setDescription(request.getDescription());
        deduction.setOfficerId(request.getOfficerId());
        deduction.setOfficerName(request.getOfficerName());
        deduction.setTargetBillingMonth(request.getTargetBillingMonth());
        deduction.setTargetBillingYear(request.getTargetBillingYear());
        deduction.setAppliedToInvoice(false);
        deduction.setAccountantApprovalStatus(DeductionApprovalStatus.PENDING);
        deduction.setCreatedAt(LocalDateTime.now());

        // Check if invoice for target period is already ISSUED → queue for next month
        boolean queueForNext = invoiceRepository
                .findByClientClientIdAndStatus(request.getClientId(), InvoiceStatus.ISSUED)
                .stream()
                .anyMatch(inv -> inv.getBillingMonth().equals(request.getTargetBillingMonth())
                        && inv.getBillingYear().equals(request.getTargetBillingYear()));

        deduction.setQueuedForNextMonth(queueForNext);

        return mapToResponse(deductionRepository.save(deduction));
    }

    @Transactional
    public DeductionResponse approveDeduction(Integer deductionId) {
        Deduction deduction = deductionRepository.findById(deductionId)
                .orElseThrow(() -> new ResourceNotFoundException("Deduction", "id", deductionId));

        if (deduction.getAppliedToInvoice()) {
            throw new InvalidOperationException("Deduction is already applied to an invoice.");
        }

        deduction.setAccountantApprovalStatus(DeductionApprovalStatus.APPROVED);
        return mapToResponse(deductionRepository.save(deduction));
    }

    @Transactional
    public DeductionResponse rejectDeduction(Integer deductionId, String reason) {
        Deduction deduction = deductionRepository.findById(deductionId)
                .orElseThrow(() -> new ResourceNotFoundException("Deduction", "id", deductionId));

        deduction.setAccountantApprovalStatus(DeductionApprovalStatus.REJECTED);
        deduction.setAccountantRejectionReason(reason);
        return mapToResponse(deductionRepository.save(deduction));
    }

    @Transactional(readOnly = true)
    public List<DeductionResponse> getAllDeductions() {
        return deductionRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeductionResponse> getDeductionsByClient(Integer clientId) {
        return deductionRepository.findByClientClientIdOrderByIncidentDateDesc(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeductionResponse> getUnappliedDeductionsByClient(Integer clientId) {
        return deductionRepository.findByClientClientIdAndAppliedToInvoiceFalse(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeductionResponse> getPendingApprovalDeductions() {
        return deductionRepository.findByAccountantApprovalStatus(DeductionApprovalStatus.PENDING)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Double getTotalUnappliedDeductionsForClient(Integer clientId) {
        return deductionRepository.getTotalUnappliedDeductionsForClient(clientId);
    }

    @Transactional(readOnly = true)
    public DeductionResponse getDeductionById(Integer deductionId) {
        return mapToResponse(deductionRepository.findById(deductionId)
                .orElseThrow(() -> new ResourceNotFoundException("Deduction", "id", deductionId)));
    }

    @Transactional
    public void deleteDeduction(Integer deductionId) {
        Deduction deduction = deductionRepository.findById(deductionId)
                .orElseThrow(() -> new ResourceNotFoundException("Deduction", "id", deductionId));
        if (deduction.getAppliedToInvoice()) {
            throw new InvalidOperationException(
                    "Cannot delete a deduction that is already applied to an invoice.");
        }
        deductionRepository.delete(deduction);
    }

    private DeductionResponse mapToResponse(Deduction d) {
        DeductionResponse r = new DeductionResponse();
        r.setDeductionId(d.getDeductionId());
        r.setClientId(d.getClient().getClientId());
        r.setCompanyName(d.getClient().getCompanyName());
        r.setDeductionType(d.getDeductionType().toString());
        r.setAmount(d.getAmount());
        r.setIncidentDate(d.getIncidentDate());
        r.setDescription(d.getDescription());
        r.setOfficerId(d.getOfficerId());
        r.setOfficerName(d.getOfficerName());
        r.setTargetBillingMonth(d.getTargetBillingMonth());
        r.setTargetBillingYear(d.getTargetBillingYear());
        r.setInvoiceId(d.getInvoice() != null ? d.getInvoice().getInvoiceId() : null);
        r.setInvoiceNumber(d.getInvoice() != null ? d.getInvoice().getInvoiceNumber() : null);
        r.setAppliedToInvoice(Boolean.TRUE.equals(d.getAppliedToInvoice()));
        r.setQueuedForNextMonth(Boolean.TRUE.equals(d.getQueuedForNextMonth()));
        r.setAccountantApprovalStatus(d.getAccountantApprovalStatus().toString());
        r.setAccountantRejectionReason(d.getAccountantRejectionReason());
        r.setCreatedAt(d.getCreatedAt());
        return r;
    }
}