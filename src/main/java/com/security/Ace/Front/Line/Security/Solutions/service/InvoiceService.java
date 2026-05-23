package com.security.Ace.Front.Line.Security.Solutions.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.security.Ace.Front.Line.Security.Solutions.dto.InvoiceCreateRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.InvoiceItemRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.InvoiceItemResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.InvoiceResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.ManualInvoiceCreateRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.Deduction;
import com.security.Ace.Front.Line.Security.Solutions.entity.Invoice;
import com.security.Ace.Front.Line.Security.Solutions.entity.InvoiceItem;
import com.security.Ace.Front.Line.Security.Solutions.entity.Payment;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ClientStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.DeductionApprovalStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.InvoiceStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.InvoiceType;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ItemType;
import com.security.Ace.Front.Line.Security.Solutions.exception.InvalidOperationException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.AttendanceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.DeductionRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.InvoiceItemRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.InvoiceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

// ManualInvoiceCreateRequest is in the dto package (already covered by dto.*)

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final BigDecimal SSCL_RATE = new BigDecimal("0.025"); // 2.5%
    private static final BigDecimal VAT_RATE = new BigDecimal("0.18"); // 18%
    private static final BigDecimal LATE_FEE_RATE = new BigDecimal("0.015"); // 1.5%
    private static final double DEFAULT_OIC_OT_HOURS_IF_LOOKUP_FAIL = 30.0;
    private static final double DEFAULT_JSO_OT_HOURS_IF_LOOKUP_FAIL = 60.0;

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final AttendanceRepository attendanceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final DeductionRepository deductionRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final PdfService pdfService;

    // ── Manual invoice creation (Phase 13) ──────────────────────────────────

    @Transactional
    public InvoiceResponse createInvoice(InvoiceCreateRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", request.getClientId()));

        // For AUTO invoices — prevent duplicate per billing period
        InvoiceType type = request.getInvoiceType() != null
                ? InvoiceType.valueOf(request.getInvoiceType())
                : InvoiceType.AUTO;

        if (type == InvoiceType.AUTO &&
                invoiceRepository.existsByClientClientIdAndBillingMonthAndBillingYear(
                        request.getClientId(), request.getBillingMonth(), request.getBillingYear())) {
            throw new InvalidOperationException(
                    "Invoice already exists for " + request.getBillingMonth() + "/" + request.getBillingYear());
        }

        // MANUAL invoices require a reason — audit trail
        if (type == InvoiceType.MANUAL &&
                (request.getManualReason() == null || request.getManualReason().isBlank())) {
            throw new InvalidOperationException("Manual invoices require a reason for audit trail");
        }

        String invoiceNumber = generateInvoiceNumber(request.getBillingYear(), request.getBillingMonth());

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setClient(client);
        invoice.setBillingMonth(request.getBillingMonth());
        invoice.setBillingYear(request.getBillingYear());
        invoice.setPeriodFrom(request.getPeriodFrom());
        invoice.setPeriodTo(request.getPeriodTo());
        invoice.setIssueDate(request.getIssueDate());
        invoice.setDueDate(request.getDueDate());
        invoice.setInvoiceType(type);
        invoice.setManualReason(request.getManualReason());
        invoice.setNotes(request.getNotes());
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setCreatedAt(LocalDateTime.now());

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Save line items
        if (request.getItems() != null) {
            for (InvoiceItemRequest itemReq : request.getItems()) {
                InvoiceItem item = new InvoiceItem();
                item.setInvoice(savedInvoice);
                item.setItemType(ItemType.valueOf(itemReq.getItemType()));
                item.setDescription(itemReq.getDescription());
                item.setQuantity(itemReq.getQuantity());
                item.setUnitPrice(BigDecimal.valueOf(itemReq.getUnitPrice()));
                item.setTaxPercentage(itemReq.getTaxPercentage() != null
                        ? BigDecimal.valueOf(itemReq.getTaxPercentage())
                        : BigDecimal.ZERO);
                // Persist line total
                item.setLineTotal(item.getUnitPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantity()))
                        .setScale(2, RoundingMode.HALF_UP));
                invoiceItemRepository.save(item);
            }
        }

        recalculateInvoiceTotals(savedInvoice.getInvoiceId());
        return mapToResponse(invoiceRepository.findById(savedInvoice.getInvoiceId()).orElseThrow());
    }
    // ── Create manual invoice from accountant portal ──────────────────────────

    @Transactional
    public InvoiceResponse createManualInvoice(ManualInvoiceCreateRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", request.getClientId()));

        LocalDate periodFrom = request.getPeriodFrom();
        int billingMonth = periodFrom.getMonthValue();
        int billingYear = periodFrom.getYear();

        // Validate ONE_TIME reason
        boolean isOneTime = "ONE_TIME".equalsIgnoreCase(request.getBillingType());
        if (isOneTime && (request.getReason() == null || request.getReason().isBlank())) {
            throw new InvalidOperationException("Reason is required for one-time manual invoices");
        }

        String manualReason = isOneTime
                ? request.getReason()
                : (request.getReason() != null && !request.getReason().isBlank()
                        ? request.getReason()
                        : "Regular manual billing");

        String invoiceNumber = generateInvoiceNumber(billingYear, billingMonth);

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setClient(client);
        invoice.setBillingMonth(billingMonth);
        invoice.setBillingYear(billingYear);
        invoice.setPeriodFrom(periodFrom);
        invoice.setPeriodTo(request.getPeriodTo() != null ? request.getPeriodTo()
                : periodFrom.withDayOfMonth(periodFrom.lengthOfMonth()));
        invoice.setIssueDate(request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now());
        invoice.setDueDate(
                request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusMonths(1).withDayOfMonth(10));
        invoice.setInvoiceType(InvoiceType.MANUAL);
        invoice.setManualReason(manualReason);
        invoice.setNotes(request.getNotes());
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setCreatedAt(LocalDateTime.now());

        Invoice savedInvoice = invoiceRepository.save(invoice);

        if (request.getItems() != null) {
            for (ManualInvoiceCreateRequest.ManualLineItem itemReq : request.getItems()) {
                if (itemReq.getDescription() == null || itemReq.getDescription().isBlank())
                    continue;
                if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0)
                    continue;
                if (itemReq.getUnitPrice() == null || itemReq.getUnitPrice() <= 0)
                    continue;

                InvoiceItem item = new InvoiceItem();
                item.setInvoice(savedInvoice);
                item.setItemType(ItemType.OTHER_CHARGE);
                item.setDescription(itemReq.getDescription());
                item.setQuantity(itemReq.getQuantity());
                item.setUnitPrice(BigDecimal.valueOf(itemReq.getUnitPrice()));
                item.setTaxPercentage(BigDecimal.ZERO);
                item.setLineTotal(BigDecimal.valueOf(itemReq.getUnitPrice())
                        .multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                        .setScale(2, RoundingMode.HALF_UP));
                invoiceItemRepository.save(item);
            }
        }

        recalculateInvoiceTotals(savedInvoice.getInvoiceId());
        return mapToResponse(invoiceRepository.findById(savedInvoice.getInvoiceId()).orElseThrow());
    }

    // ── Update invoice notes ────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse updateInvoiceNotes(Integer invoiceId, String notes) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));
        invoice.setNotes(notes);
        return mapToResponse(invoiceRepository.save(invoice));
    }

    // ── Batch approve-and-issue ─────────────────────────────────────────────

    @Transactional
    public void approveBatch(List<Integer> ids) {
        for (Integer id : ids) {
            try {
                Invoice invoice = invoiceRepository.findById(id).orElse(null);
                if (invoice == null)
                    continue;

                // Approve if DRAFT
                if (invoice.getStatus() == InvoiceStatus.DRAFT) {
                    invoice.setStatus(InvoiceStatus.APPROVED);
                    invoice.setApprovedAt(LocalDateTime.now());
                    invoice.setApprovedBy(0);
                    invoice = invoiceRepository.save(invoice);
                }

                // Issue if APPROVED
                if (invoice.getStatus() == InvoiceStatus.APPROVED) {
                    invoice.setStatus(InvoiceStatus.ISSUED);
                    invoice.setIssuedAt(LocalDateTime.now());
                    invoice = invoiceRepository.save(invoice);
                    // Send email — best effort
                    try {
                        byte[] pdf = pdfService.generateInvoicePdf(invoice.getInvoiceId());
                        emailService.sendInvoiceEmail(invoice.getClient(), invoice, pdf);
                    } catch (Exception ignored) {
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }
    // ── Auto-generate invoices for all active clients (1st of month) ─────────

    @Transactional
    public void generateMonthlyInvoices(int month, int year) {
        List<Client> activeClients = clientRepository.findByStatus(ClientStatus.ACTIVE);
        YearMonth ym = YearMonth.of(year, month);
        LocalDate periodFrom = ym.atDay(1);
        LocalDate periodTo = ym.atEndOfMonth();
        LocalDate issueDate = LocalDate.of(year, month, 1);
        // Due date = 15th of the current month (invoice is issued for the previous
        // month)
        LocalDate dueDate = issueDate.plusMonths(1).withDayOfMonth(10);
        int billingMonth = month;
        int billingYear = year;

        for (Client client : activeClients) {
            // Skip if invoice already exists for this period
            if (invoiceRepository.existsByClientClientIdAndBillingMonthAndBillingYear(
                    client.getClientId(), billingMonth, billingYear)) {
                continue;
            }

            String invoiceNumber = generateInvoiceNumber(billingYear, billingMonth);

            Invoice invoice = new Invoice();
            invoice.setInvoiceNumber(invoiceNumber);
            invoice.setClient(client);
            invoice.setBillingMonth(billingMonth);
            invoice.setBillingYear(billingYear);
            invoice.setPeriodFrom(periodFrom);
            invoice.setPeriodTo(periodTo);
            invoice.setIssueDate(issueDate);
            invoice.setDueDate(dueDate);
            invoice.setInvoiceType(InvoiceType.AUTO);
            invoice.setStatus(InvoiceStatus.DRAFT);
            invoice.setCreatedAt(LocalDateTime.now());

            Invoice savedInvoice = invoiceRepository.save(invoice);

            // Calculate number of shifts in the billing month
            int shiftsInMonth = ym.lengthOfMonth();

            // --- 4-Tier Staffing Model Line Items ---

            // Entry-level
            addServiceItem(savedInvoice, client.getEntryLevelCount(), client.getEntryLevelRatePerShift(),
                    ItemType.ENTRY_LEVEL_SERVICE, "Entry-level Officers", shiftsInMonth);
            addOvertimeItem(savedInvoice, client, "ENTRY_LEVEL", client.getEntryLevelOtRatePerHour(),
                    ItemType.ENTRY_LEVEL_OT, "Entry-level Overtime", periodFrom, periodTo);

            // Mid-level
            addServiceItem(savedInvoice, client.getMidLevelCount(), client.getMidLevelRatePerShift(),
                    ItemType.MID_LEVEL_SERVICE, "Mid-level Officers", shiftsInMonth);
            addOvertimeItem(savedInvoice, client, "MID_LEVEL", client.getMidLevelOtRatePerHour(),
                    ItemType.MID_LEVEL_OT, "Mid-level Overtime", periodFrom, periodTo);

            // Specialized
            addServiceItem(savedInvoice, client.getSpecializedCount(), client.getSpecializedRatePerShift(),
                    ItemType.SPECIALIZED_SERVICE, "Specialized Officers", shiftsInMonth);
            addOvertimeItem(savedInvoice, client, "SPECIALIZED", client.getSpecializedOtRatePerHour(),
                    ItemType.SPECIALIZED_OT, "Specialized Overtime", periodFrom, periodTo);

            // Supervisor/Management
            addServiceItem(savedInvoice, client.getSupervisorCount(), client.getSupervisorRatePerShift(),
                    ItemType.SUPERVISOR_SERVICE, "Supervisor/Management Officers", shiftsInMonth);
            addOvertimeItem(savedInvoice, client, "SUPERVISOR", client.getSupervisorOtRatePerHour(),
                    ItemType.SUPERVISOR_OT, "Supervisor/Management Overtime", periodFrom, periodTo);

            // Link approved deductions for this billing period
            List<Deduction> deductions = deductionRepository
                    .findByClientClientIdAndTargetBillingMonthAndTargetBillingYear(
                            client.getClientId(), billingMonth, billingYear);
            for (Deduction d : deductions) {
                if (d.getAccountantApprovalStatus() == DeductionApprovalStatus.APPROVED
                        && !d.getAppliedToInvoice()) {
                    d.setInvoice(savedInvoice);
                    d.setAppliedToInvoice(true);
                    deductionRepository.save(d);
                }
            }

            recalculateInvoiceTotals(savedInvoice.getInvoiceId());
        }
    }

    // ── DRAFT → APPROVED ────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse approveInvoice(Integer invoiceId, Integer accountantUserId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new InvalidOperationException("Only DRAFT invoices can be approved. Current status: "
                    + invoice.getStatus());
        }

        invoice.setStatus(InvoiceStatus.APPROVED);
        invoice.setApprovedAt(LocalDateTime.now());
        invoice.setApprovedBy(accountantUserId);
        return mapToResponse(invoiceRepository.save(invoice));
    }

    // ── APPROVED → ISSUED ────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse issueInvoice(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (invoice.getStatus() != InvoiceStatus.APPROVED) {
            throw new InvalidOperationException(
                    "Only APPROVED invoices can be issued. Current status: " + invoice.getStatus()
                            + ". Please approve the invoice first.");
        }

        invoice.setStatus(InvoiceStatus.ISSUED);
        invoice.setIssuedAt(LocalDateTime.now());
        final Invoice issuedInvoice = invoiceRepository.save(invoice);

        // Send invoice email with PDF to client — async so HTTP response returns
        // immediately
        byte[] pdf = pdfService.generateInvoicePdf(issuedInvoice.getInvoiceId());
        CompletableFuture.runAsync(() -> emailService.sendInvoiceEmail(issuedInvoice.getClient(), issuedInvoice, pdf));

        return mapToResponse(issuedInvoice);
    }

    // ── CANCEL ────────────────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse cancelInvoice(Integer invoiceId, String cancellationReason) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new InvalidOperationException("PAID invoices cannot be cancelled. Raise a credit note instead.");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new InvalidOperationException("Invoice is already cancelled.");
        }
        if (cancellationReason == null || cancellationReason.isBlank()) {
            throw new InvalidOperationException("Cancellation reason is required.");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoice.setCancellationReason(cancellationReason);
        return mapToResponse(invoiceRepository.save(invoice));
    }

    // ── DISPUTE ───────────────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse disputeInvoice(Integer invoiceId, String disputeReason) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (invoice.getStatus() == InvoiceStatus.PAID
                || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new InvalidOperationException("Cannot dispute a " + invoice.getStatus() + " invoice.");
        }

        invoice.setStatus(InvoiceStatus.DISPUTED);
        invoice.setDisputeReason(disputeReason);
        return mapToResponse(invoiceRepository.save(invoice));
    }

    // ── WAIVE ─────────────────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse waiveInvoice(Integer invoiceId, String waivedReason, Double waivedAmount) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (waivedReason == null || waivedReason.isBlank()) {
            throw new InvalidOperationException("Waiver reason is required for audit trail.");
        }

        invoice.setStatus(InvoiceStatus.WAIVED);
        invoice.setWaivedReason(waivedReason);
        invoice.setWaivedAmount(BigDecimal.valueOf(waivedAmount));
        invoiceRepository.save(invoice);
        recalculateInvoiceTotals(invoiceId);
        return mapToResponse(invoiceRepository.findById(invoiceId).orElseThrow());
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getDraftInvoices() {
        return invoiceRepository.findAllDraftInvoices().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Integer invoiceId) {
        return mapToResponse(invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId)));
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByClient(Integer clientId) {
        return invoiceRepository.findClientVisibleInvoices(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getClientInvoiceHistory(Integer clientId) {
        return invoiceRepository.findClientInvoiceHistory(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getPendingInvoicesByClient(Integer clientId) {
        return invoiceRepository.findPendingInvoicesByClient(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getOverdueInvoices() {
        return invoiceRepository.findOverdueInvoices()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private Double getOtHoursOrFallback(Integer clientId, String rank,
            LocalDate startDate, LocalDate endDate,
            double fallbackHours) {
        try {
            Double hours = attendanceRepository
                    .sumOvertimeHoursByClientAndRankInPeriod(clientId, rank, startDate, endDate);
            return hours != null ? hours : fallbackHours;
        } catch (Exception ex) {
            return fallbackHours;
        }
    }

    // ── Recalculate totals — SSCL + VAT split ────────────────────────────────

    @Transactional
    public void deleteInvoice(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));
        invoiceItemRepository.deleteAll(invoice.getItems());
        invoiceRepository.delete(invoice);
    }

    public void recalculateInvoiceTotals(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        List<InvoiceItem> items = invoiceItemRepository.findByInvoiceInvoiceId(invoiceId);

        BigDecimal oicTotal = BigDecimal.ZERO;
        BigDecimal jsoTotal = BigDecimal.ZERO;
        BigDecimal otTotal = BigDecimal.ZERO;
        BigDecimal otherChargesTotal = BigDecimal.ZERO;
        BigDecimal deductionsTotal = BigDecimal.ZERO;

        for (InvoiceItem item : items) {
            BigDecimal lineTotal = item.getUnitPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            // Update persisted line total
            item.setLineTotal(lineTotal);
            invoiceItemRepository.save(item);

            switch (item.getItemType()) {
                case ENTRY_LEVEL_SERVICE:
                case MID_LEVEL_SERVICE:
                case SPECIALIZED_SERVICE:
                case SUPERVISOR_SERVICE:
                    oicTotal = oicTotal.add(lineTotal); // Reusing oicTotal for all service charges for subtotal
                                                        // purposes
                    break;
                case OVERTIME:
                case ENTRY_LEVEL_OT:
                case MID_LEVEL_OT:
                case SPECIALIZED_OT:
                case SUPERVISOR_OT:
                    otTotal = otTotal.add(lineTotal);
                    break;
                case OTHER_CHARGE:
                    otherChargesTotal = otherChargesTotal.add(lineTotal);
                    break;
                case DEDUCTION:
                    deductionsTotal = deductionsTotal.add(lineTotal);
                    break;
                default:
                    break; // SSCL, VAT, LATE_FEE handled below
            }
        }

        // Also sum deductions linked to this invoice from the deductions table
        List<Deduction> linkedDeductions = deductionRepository
                .findByInvoiceInvoiceIdAndAccountantApprovalStatus(invoiceId, DeductionApprovalStatus.APPROVED);

        for (Deduction d : linkedDeductions) {
            // Ensure applied status is consistent once linked
            if (!Boolean.TRUE.equals(d.getAppliedToInvoice())) {
                d.setAppliedToInvoice(true);
                deductionRepository.save(d);
            }
            deductionsTotal = deductionsTotal.add(d.getAmount());
        }

        // Subtotal = OIC + JSO + OT
        BigDecimal subtotal = oicTotal.add(jsoTotal).add(otTotal);

        // Net Subtotal = Subtotal − Deductions
        BigDecimal netSubtotal = subtotal.subtract(deductionsTotal)
                .max(BigDecimal.ZERO); // never negative

        // Invoice Amount = Net Subtotal + Other Charges (pre-tax)
        BigDecimal invoiceAmount = netSubtotal.add(otherChargesTotal);

        // SSCL = 2.5% of Invoice Amount
        BigDecimal ssclAmount = invoiceAmount.multiply(SSCL_RATE)
                .setScale(2, RoundingMode.HALF_UP);

        // VAT = 18% of Invoice Amount
        BigDecimal vatAmount = invoiceAmount.multiply(VAT_RATE)
                .setScale(2, RoundingMode.HALF_UP);

        // TOTAL PAYABLE = Invoice Amount + SSCL + VAT
        BigDecimal totalAmount = invoiceAmount.add(ssclAmount).add(vatAmount);

        // Paid amount from verified payments
        Double paidDouble = paymentRepository.getTotalVerifiedAmountForInvoice(invoiceId);
        BigDecimal paidAmount = paidDouble != null
                ? BigDecimal.valueOf(paidDouble).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal balanceAmount = totalAmount.subtract(paidAmount).max(BigDecimal.ZERO);

        // Persist all calculated fields
        invoice.setSubtotal(subtotal);
        invoice.setDeductionsTotal(deductionsTotal);
        invoice.setNetSubtotal(netSubtotal);
        invoice.setOtherCharges(otherChargesTotal);
        invoice.setInvoiceAmount(invoiceAmount);
        invoice.setSsclAmount(ssclAmount);
        invoice.setVatAmount(vatAmount);
        invoice.setTotalAmount(totalAmount);
        invoice.setPaidAmount(paidAmount);
        invoice.setBalanceAmount(balanceAmount);

        invoiceRepository.save(invoice);
    }

    // ── Invoice number generation ─────────────────────────────────────────────

    private String generateInvoiceNumber(Integer year, Integer month) {
        String prefix = String.format("INV-%d-%02d-", year, month);
        String maxNumber = invoiceRepository.findMaxInvoiceNumberByPrefix(prefix + "%");

        int nextId = 1;
        if (maxNumber != null) {
            try {
                String suffix = maxNumber.substring(prefix.length());
                nextId = Integer.parseInt(suffix) + 1;
            } catch (Exception e) {
                // Fallback loop as a safety measure if format is weird
                long count = invoiceRepository.countInvoicesForMonth(month, year);
                String invoiceNumber;
                do {
                    invoiceNumber = String.format("%s%04d", prefix, count + 1);
                    count++;
                } while (invoiceRepository.findByInvoiceNumber(invoiceNumber).isPresent());
                return invoiceNumber;
            }
        }

        return String.format("%s%04d", prefix, nextId);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private InvoiceResponse mapToResponse(Invoice invoice) {
        InvoiceResponse r = new InvoiceResponse();
        r.setInvoiceId(invoice.getInvoiceId());
        r.setInvoiceNumber(invoice.getInvoiceNumber());
        r.setClientId(invoice.getClient().getClientId());
        r.setCompanyName(invoice.getClient().getCompanyName());
        r.setClientVatNumber(invoice.getClient().getVatNumber());
        r.setServiceLocation(invoice.getClient().getServiceLocation());
        r.setBillingMonth(invoice.getBillingMonth());
        r.setBillingYear(invoice.getBillingYear());
        r.setPeriodFrom(invoice.getPeriodFrom());
        r.setPeriodTo(invoice.getPeriodTo());
        r.setIssueDate(invoice.getIssueDate());
        r.setDueDate(invoice.getDueDate());
        r.setSubtotal(bd(invoice.getSubtotal()));
        r.setDeductionsTotal(bd(invoice.getDeductionsTotal()));
        r.setNetSubtotal(bd(invoice.getNetSubtotal()));
        r.setOtherCharges(bd(invoice.getOtherCharges()));
        r.setInvoiceAmount(bd(invoice.getInvoiceAmount()));
        r.setSsclAmount(bd(invoice.getSsclAmount()));
        r.setVatAmount(bd(invoice.getVatAmount()));
        r.setTotalAmount(bd(invoice.getTotalAmount()));
        r.setPaidAmount(bd(invoice.getPaidAmount()));
        r.setBalanceAmount(bd(invoice.getBalanceAmount()));
        r.setLateFee(bd(invoice.getLateFee()));
        r.setInvoiceType(invoice.getInvoiceType() != null ? invoice.getInvoiceType().toString() : null);
        r.setStatus(invoice.getStatus().toString());
        r.setNotes(invoice.getNotes());
        r.setManualReason(invoice.getManualReason());
        r.setDisputeReason(invoice.getDisputeReason());
        r.setApprovedAt(invoice.getApprovedAt());
        r.setIssuedAt(invoice.getIssuedAt());
        r.setVerifiedAt(invoice.getVerifiedAt());
        r.setCreatedAt(invoice.getCreatedAt());

        List<InvoiceItem> items = invoiceItemRepository.findByInvoiceInvoiceId(invoice.getInvoiceId());
        r.setItems(items.stream().map(this::mapItemToResponse).collect(Collectors.toList()));

        List<Payment> payments = paymentRepository
                .findByInvoiceInvoiceIdOrderByPaymentDateDesc(invoice.getInvoiceId());
        r.setPayments(payments.stream().map(this::mapPaymentToResponse).collect(Collectors.toList()));

        return r;
    }

    private InvoiceItemResponse mapItemToResponse(InvoiceItem item) {
        InvoiceItemResponse r = new InvoiceItemResponse();
        r.setItemId(item.getItemId());
        r.setItemType(item.getItemType().toString());
        r.setDescription(item.getDescription());
        r.setQuantity(item.getQuantity());
        r.setUnitPrice(item.getUnitPrice());
        r.setLineTotal(item.getLineTotal());
        r.setTaxPercentage(item.getTaxPercentage());
        return r;
    }

    private PaymentResponse mapPaymentToResponse(Payment payment) {
        PaymentResponse r = new PaymentResponse();
        r.setPaymentId(payment.getPaymentId());
        r.setInvoiceId(payment.getInvoice().getInvoiceId());
        r.setInvoiceNumber(payment.getInvoice().getInvoiceNumber());
        r.setClientId(payment.getClient().getClientId());
        r.setCompanyName(payment.getClient().getCompanyName());
        r.setAmountPaid(payment.getAmountPaid().doubleValue());
        r.setPaymentDate(payment.getPaymentDate());
        r.setPaymentMethod(payment.getPaymentMethod().toString());
        r.setTransactionReference(payment.getTransactionReference());
        r.setPaymentProofPath(payment.getPaymentProofPath());
        r.setVerificationStatus(payment.getVerificationStatus().toString());
        r.setRemarks(payment.getRemarks());
        r.setRejectionReason(payment.getRejectionReason());
        r.setProofUploadedAt(payment.getProofUploadedAt());
        r.setVerifiedAt(payment.getVerifiedAt());
        r.setVerifiedBy(payment.getVerifiedBy());
        return r;
    }

    private void addServiceItem(Invoice invoice, Integer count, BigDecimal rate, ItemType type, String label,
            int shifts) {
        if (count != null && count > 0 && rate != null) {
            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setItemType(type);
            item.setDescription(label + " — " + count + " officers × " + shifts + " shifts");
            item.setQuantity((double) (count * shifts));
            item.setUnitPrice(rate);
            item.setTaxPercentage(BigDecimal.ZERO);
            item.setLineTotal(rate.multiply(BigDecimal.valueOf(count * shifts)).setScale(2, RoundingMode.HALF_UP));
            invoiceItemRepository.save(item);
        }
    }

    private void addOvertimeItem(Invoice invoice, Client client, String rank, BigDecimal rankOtRate, ItemType type,
            String label, LocalDate from, LocalDate to) {
        Double otHours = attendanceRepository.sumOvertimeHoursByClientAndRankInPeriod(client.getClientId(), rank, from,
                to);
        BigDecimal finalOtRate = rankOtRate != null ? rankOtRate : client.getOtRatePerHour();

        if (otHours != null && otHours > 0 && finalOtRate != null && finalOtRate.compareTo(BigDecimal.ZERO) > 0) {
            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setItemType(type);
            item.setDescription(label + " — " + otHours + " hours");
            item.setQuantity(otHours);
            item.setUnitPrice(finalOtRate);
            item.setTaxPercentage(BigDecimal.ZERO);
            item.setLineTotal(finalOtRate.multiply(BigDecimal.valueOf(otHours)).setScale(2, RoundingMode.HALF_UP));
            invoiceItemRepository.save(item);
        }
    }

    private Double bd(BigDecimal val) {
        return val != null ? val.doubleValue() : 0.0;
    }
}