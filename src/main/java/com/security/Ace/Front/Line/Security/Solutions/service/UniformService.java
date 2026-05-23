package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.UniformRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.entity.UniformRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.UniformRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
/**
 * STAFF AUTHENTICATION
 */
@Service
@RequiredArgsConstructor
public class UniformService {

    private final UniformRequestRepository uniformRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public UniformRequest requestUniform(String username, UniformRequestDto dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UniformRequest request = UniformRequest.builder()
                .user(user)
                .uniformSize(dto.getUniformSize())
                .uniformType(dto.getUniformType())
                .quantity(dto.getQuantity())
                .notes(dto.getNotes())
                .status(RequestStatus.PENDING)
                .build();

        return uniformRequestRepository.save(request);
    }

    public List<UniformRequest> getMyRequests(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return uniformRequestRepository.findByUser(user);
    }

    public List<UniformRequest> getAllRequests() {
        return uniformRequestRepository.findAll();
    }

    public List<UniformRequest> getPendingRequests() {
        return uniformRequestRepository.findByStatus(RequestStatus.PENDING);
    }

    @Transactional
    public UniformRequest reviewRequest(Long requestId, String reviewerUsername, ReviewRequest reviewRequest) {
        UniformRequest uniformReq = uniformRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Uniform request not found"));

        if (uniformReq.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Uniform request is already processed");
        }

        User reviewer = userRepository.findByUsername(reviewerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found"));

        if (reviewRequest.isApproved()) {
            uniformReq.setStatus(RequestStatus.APPROVED);
        } else {
            uniformReq.setStatus(RequestStatus.REJECTED);
            uniformReq.setRejectionReason(reviewRequest.getRejectionReason());
        }

        uniformReq.setReviewedBy(reviewer);
        uniformReq.setReviewedAt(LocalDateTime.now());
        return uniformRequestRepository.save(uniformReq);
    }
}
