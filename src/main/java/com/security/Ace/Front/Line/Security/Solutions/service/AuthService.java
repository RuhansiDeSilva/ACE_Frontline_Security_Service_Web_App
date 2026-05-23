// package com.security.Ace.Front.Line.Security.Solutions.service;

// import com.security.Ace.Front.Line.Security.Solutions.dto.LoginRequest;
// import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
// import com.security.Ace.Front.Line.Security.Solutions.entity.User;
// import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.stereotype.Service;
// import org.springframework.web.context.request.RequestContextHolder;
// import org.springframework.web.context.request.ServletRequestAttributes;

// import java.util.Optional;

// @Service
// public class AuthService {

//     @Autowired
//     private UserRepository userRepository;

//     /**
//      * Resolves the current user from {@code X-User-Email} (same as other APIs) or Spring Security context.
//      */
//     public User getCurrentUser() {
//         ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
//         if (attrs != null) {
//             String email = attrs.getRequest().getHeader("X-User-Email");
//             if (email != null && !email.isBlank()) {
//                 return userRepository.findByEmail(email.trim())
//                         .orElseThrow(() -> new RuntimeException("User not found for email: " + email.trim()));
//             }
//         }
//         Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//         if (auth != null && auth.isAuthenticated() && auth.getPrincipal() != null) {
//             Object p = auth.getPrincipal();
//             if (p instanceof String s && !"anonymousUser".equals(s)) {
//                 return userRepository.findByEmail(s)
//                         .orElseThrow(() -> new RuntimeException("User not found"));
//             }
//         }
//         throw new RuntimeException("Not authenticated");
//     }

//     public LoginResponse login(LoginRequest loginRequest) {
//         Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());

//         if (userOptional.isPresent()) {
//             User user = userOptional.get();
//             if (user.getPassword().equals(loginRequest.getPassword())) { // In a real app, use BCrypt
//                 String redirectUrl = getRedirectUrl(user.getRole());
//                 return new LoginResponse("Login Successful", user.getRole(), redirectUrl);
//             }
//         }
//         throw new RuntimeException("Invalid Credentials");
//     }

//     private String getRedirectUrl(String role) {
//         if (role == null) {
//             return "/";
//         }
//         switch (role) {
//             case "AREA_MANAGER":
//                 return "/area-manager";
//             case "OPERATIONAL_MANAGER":
//                 return "/operational-manager";
//             case "EXECUTIVE":
//                 return "/executive-officer";
//             case "CHAIRMAN":
//                 return "/chairman";
//             case "DIRECTOR":
//                 return "/director";
//             case "ACCOUNTANT":
//                 return "/accountant";
//             case "SECURITY_OFFICER":
//             case "JSO":
//             case "SSO":
//             case "LSO":
//             case "CSO":
//                 return "/security-officer";
//             default:
//                 return "/";
//         }
//     }
// }
package com.security.Ace.Front.Line.Security.Solutions.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import com.security.Ace.Front.Line.Security.Solutions.dto.ChangePasswordRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ForgotPasswordRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.RegisterUserRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ResetPasswordRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.UpdatePersonalInfoRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.UserProfileResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.AssignedOfficer;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.OtpToken;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.OfficerRank;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ShiftType;
import com.security.Ace.Front.Line.Security.Solutions.exception.AuthenticationException;
import com.security.Ace.Front.Line.Security.Solutions.repository.AssignedOfficerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.OtpTokenRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.JwtUtil;
import com.security.Ace.Front.Line.Security.Solutions.util.OtpUtil;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpTokenRepository otpTokenRepository;
    private final EmailService emailService;
    private final OtpUtil otpUtil;
    private final FileStorageService fileStorageService;
    private final ClientRepository clientRepository;
    private final AssignedOfficerRepository assignedOfficerRepository;

    /**
     * Handles user login with a fallback for legacy plain-text passwords.
     * It will automatically upgrade plain-text passwords to a secure hash upon
     * successful login.
     * Supports username-based lookup for staff users.
     *
     * @param request The login request containing username and password.
     * @return A LoginResponse with status, role, redirect URL, and JWT.
     */
    @org.springframework.transaction.annotation.Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AuthenticationException("Invalid username or password."));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AuthenticationException("Your account has been deactivated. Please contact an administrator.");
        }

        boolean passwordMatches = false;

        // 1. Try secure password check first (recommended)
        if (user.getPassword() != null && user.getPassword().startsWith("$2a$")
                && passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            passwordMatches = true;
        }
        // 2. If secure check fails, try legacy plain-text check (SECURITY RISK)
        else if (user.getPassword() != null && user.getPassword().equals(request.getPassword())) {
            log.warn(
                    "SECURITY ALERT: User '{}' logged in with a plain-text password. Upgrading password to a secure hash now.",
                    user.getUsername());
            // Upgrade the password to a hashed version
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            passwordMatches = true;
        }

        if (!passwordMatches) {
            throw new AuthenticationException("Invalid username or password.");
        }

        // Update last login and save the (potentially upgraded) user
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Generate JWT and determine redirect URL (use email for JWT if available,
        // otherwise username)
        String jwtSubject = user.getEmail() != null && !user.getEmail().isEmpty() ? user.getEmail()
                : user.getUsername();
        String token = jwtUtil.generateStaffToken(jwtSubject, user.getRole());
        String redirectUrl = getRedirectUrl(user.getRole());

        // Return a response that works for both old and new systems
        return new LoginResponse("Login successful", user.getRole(), redirectUrl, token, user.getId());
    }

    /**
     * Resolves the current authenticated user from the Spring Security context
     * or a custom 'X-User-Email' header for legacy compatibility.
     *
     * @return The authenticated User entity.
     * @throws AuthenticationException if no user is found.
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public User getCurrentUser() {
        // 1. Prioritize standard Spring Security context (Modern JWT authentication)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            String subject = authentication.getName(); // Can be email or username from JWT

            // Try to find by email first (if it looks like an email)
            if (subject.contains("@")) {
                return userRepository.findByEmail(subject)
                        .orElseThrow(() -> new AuthenticationException(
                                "Authenticated user not found in database: " + subject));
            }

            // Otherwise try to find by username
            return userRepository.findByUsername(subject)
                    .orElseThrow(
                            () -> new AuthenticationException("Authenticated user not found in database: " + subject));
        }

        // 2. Fallback to custom header (for legacy API calls)
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            String emailFromHeader = request.getHeader("X-User-Email");
            if (emailFromHeader != null && !emailFromHeader.isBlank()) {
                return userRepository.findByEmail(emailFromHeader.trim())
                        .orElseThrow(() -> new AuthenticationException(
                                "User not found for email from header: " + emailFromHeader.trim()));
            }
        }

        // If no user can be resolved via JWT or legacy header, throw an exception
        throw new AuthenticationException("User is not authenticated.");
    }

    /**
     * Generates OTP and sends it to the authenticated user's email.
     * Invalidates any previous OTPs for this user.
     *
     * @throws AuthenticationException if user is not authenticated
     */
    @org.springframework.transaction.annotation.Transactional
    public void sendOtpForPasswordChange() {
        User user = getCurrentUser();

        // Invalidate all previous OTPs for this user
        otpTokenRepository.invalidateAllUserOtps(user);

        // Generate new OTP
        String otp = otpUtil.generateOtp();

        // Create and save OTP token with 10-minute expiry
        OtpToken otpToken = OtpToken.builder()
                .otp(otp)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();
        otpTokenRepository.save(otpToken);

        // Send OTP via email
        emailService.sendSimpleEmail(
                user.getEmail(),
                "Your Password Change OTP",
                buildOtpEmailBody(user.getFullName(), otp));

        log.info("OTP sent to user: {}", user.getEmail());
    }

    /**
     * Changes the user's password after OTP verification.
     * The OTP must be valid (not expired and not used) and the new passwords must
     * match.
     *
     * @param request ChangePasswordRequest containing OTP, newPassword, and
     *                confirmPassword
     * @throws AuthenticationException if validation fails
     */
    @org.springframework.transaction.annotation.Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();

        // Validate new passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AuthenticationException("New password and confirm password do not match.");
        }

        // Find the user's latest OTP
        OtpToken otpToken = otpTokenRepository.findTopByUserAndUsedFalseOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new AuthenticationException("No OTP found. Please request a new OTP."));

        // Verify OTP is not expired
        if (otpToken.isExpired()) {
            throw new AuthenticationException("OTP has expired. Please request a new one.");
        }

        // Verify OTP matches (compare as strings for safety)
        if (!otpToken.getOtp().equals(request.getOtp())) {
            throw new AuthenticationException("Invalid OTP code.");
        }

        // Mark OTP as used
        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        // Update user password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setLastPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Password changed for user: {}", user.getEmail());
    }

    /**
     * Initiates forgot password flow for staff users.
     * Generates OTP and sends it to the user's registered email.
     * 
     * @param request ForgotPasswordRequest containing user's email
     * @throws AuthenticationException if email not found or sending fails
     */
    @org.springframework.transaction.annotation.Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("Email not found in our system"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AuthenticationException("This account has been deactivated. Please contact an administrator.");
        }

        // Invalidate all previous OTPs for this user
        otpTokenRepository.invalidateAllUserOtps(user);

        // Generate new OTP
        String otp = otpUtil.generateOtp();

        // Create and save OTP token with 10-minute expiry
        OtpToken otpToken = OtpToken.builder()
                .otp(otp)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();
        otpTokenRepository.save(otpToken);

        // Send OTP via email
        emailService.sendSimpleEmail(
                user.getEmail(),
                "Password Reset OTP - Ace Front Line Security",
                buildForgotPasswordEmailBody(user.getFullName(), otp));

        log.info("Forgot password OTP sent to email: {}", user.getEmail());
    }

    /**
     * Resets the user's password after OTP validation in forgot password flow.
     * Validates email, OTP, and password requirements before updating.
     * 
     * @param request ResetPasswordRequest containing email, OTP, and new password
     * @throws AuthenticationException if validation fails
     */
    @org.springframework.transaction.annotation.Transactional
    public void resetPasswordWithForgotOtp(ResetPasswordRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("Email not found in our system"));

        // Validate new passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AuthenticationException("New password and confirm password do not match");
        }

        // Find the user's latest OTP
        OtpToken otpToken = otpTokenRepository.findTopByUserAndUsedFalseOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new AuthenticationException("No valid OTP found. Please request a new OTP"));

        // Verify OTP is not expired
        if (otpToken.isExpired()) {
            throw new AuthenticationException("OTP has expired. Please request a new one");
        }

        // Verify OTP matches (case-sensitive string comparison)
        if (!otpToken.getOtp().equals(request.getOtp())) {
            throw new AuthenticationException("Invalid OTP code");
        }

        // Mark OTP as used
        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        // Update user password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setLastPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Password reset successfully for user: {}", user.getEmail());
    }

    /**
     * Builds email body for forgot password OTP emails.
     */
    private String buildForgotPasswordEmailBody(String fullName, String otp) {
        return String.format(
                "Hello %s,\n\n" +
                        "You have requested to reset your password. Here is your One-Time Password (OTP):\n\n" +
                        "OTP: %s\n\n" +
                        "This OTP is valid for 10 minutes only. Do not share this code with anyone.\n\n" +
                        "Steps to reset your password:\n" +
                        "1. Enter this OTP along with your new password on the password reset page\n" +
                        "2. Ensure your password is strong: at least 8 characters with uppercase, lowercase, number, and special character\n"
                        +
                        "3. Click 'Reset Password' to complete the process\n\n" +
                        "If you did not request a password reset, please ignore this email and your account will remain secure.\n\n"
                        +
                        "Best regards,\n" +
                        "Ace Front Line Security Solutions\n" +
                        "Security Team",
                fullName, otp);
    }

    /**
     * Builds the email body for OTP emails.
     */
    private String buildOtpEmailBody(String fullName, String otp) {
        return String.format(
                "Hello %s,\n\n" +
                        "Your One-Time Password (OTP) for changing your password is:\n\n" +
                        "OTP: %s\n\n" +
                        "This OTP is valid for 10 minutes only. Do not share this code with anyone.\n\n" +
                        "If you did not request a password change, please ignore this email.\n\n" +
                        "Best regards,\n" +
                        "Ace Front Line Security Solutions",
                fullName, otp);
    }

    /**
     * Registers a new staff user with optional photo upload.
     * Validates all input, creates user, and stores photo if provided.
     *
     * @param request The registration request
     * @param photo   Optional profile photo
     * @return UserProfileResponse for the newly created user
     * @throws RuntimeException if validation fails or user already exists
     */
    @org.springframework.transaction.annotation.Transactional
    public UserProfileResponse registerUser(RegisterUserRequest request, MultipartFile photo) {
        // Validate username doesn't already exist
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AuthenticationException("Username already exists");
        }

        // Validate email doesn't already exist
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AuthenticationException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setNicNumber(request.getNicNumber());
        user.setSex(request.getSex());
        user.setBloodGroup(request.getBloodGroup());
        user.setResidentialAddress(request.getResidentialAddress());
        user.setMobileNumber(request.getMobileNumber());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setEmergencyContact(request.getEmergencyContact());
        user.setRole(request.getRole() != null ? request.getRole() : "SECURITY_OFFICER");
        user.setDesignation(request.getDesignation());
        user.setAssignedArea(request.getAssignedArea());
        user.setAssignedCompany(request.getAssignedCompany());
        user.setJoinDate(request.getJoinDate());
        user.setBasicSalary(request.getBasicSalary());
        user.setAdminPosition(request.getAdminPosition());
        user.setProfessionalCertificate(request.getProfessionalCertificate());
        user.setSpecialSkills(request.getSpecialSkills());
        user.setBankName(request.getBankName());
        user.setBankAccountNumber(request.getBankAccountNumber());
        user.setBankBranch(request.getBankBranch());
        user.setIsActive(true);
        user.setFirstLogin(true); // New users are on their first login
        user.setQrActivated(false); // Security measure - QR activation required

        // Handle photo upload
        if (photo != null && !photo.isEmpty()) {
            String photoPath = fileStorageService.storeFile(photo, "photos/staff");
            user.setPhotoPath(photoPath);
        }

        // Save user
        user = userRepository.save(user);
        log.info("New user registered: {} ({})", user.getUsername(), user.getFullName());

        createClientAssignmentIfNeeded(user);

        // Return as UserProfileResponse
        return mapUserToProfileResponse(user);
    }

    private void createClientAssignmentIfNeeded(User user) {
        if (user == null || user.getAssignedCompany() == null || user.getAssignedCompany().isBlank()) {
            return;
        }

        String role = user.getRole() != null ? user.getRole().trim() : "";
        if (!role.equalsIgnoreCase("SECURITY_OFFICER")
                && !role.equalsIgnoreCase("JSO")
                && !role.equalsIgnoreCase("SSO")
                && !role.equalsIgnoreCase("LSO")
                && !role.equalsIgnoreCase("CSO")) {
            return;
        }

        String companyName = user.getAssignedCompany().trim();
        Client client = clientRepository.findAll().stream()
                .filter(c -> c.getCompanyName() != null && c.getCompanyName().trim().equalsIgnoreCase(companyName))
                .findFirst()
                .orElse(null);

        if (client == null) {
            log.warn("User {} registered with assigned company '{}' but no matching client was found",
                    user.getUsername(), companyName);
            return;
        }

        AssignedOfficer assignment = new AssignedOfficer();
        assignment.setClient(client);
        assignment.setOfficerId(Math.toIntExact(user.getId()));
        assignment.setOfficerName(user.getFullName());
        assignment.setOfficerRank(resolveOfficerRank(user));
        assignment.setShiftType(ShiftType.DAY);
        assignment.setAssignedFrom(LocalDate.now());
        assignment.setAssignedTo(null);
        assignment.setIsActive(true);
        assignment.setAssignedAt(LocalDateTime.now());

        assignedOfficerRepository.save(assignment);
        log.info("Created active client assignment for user {} at company {}", user.getUsername(), companyName);
    }

    private OfficerRank resolveOfficerRank(User user) {
        String role = user.getRole() != null ? user.getRole().trim().toUpperCase() : "";
        String designation = user.getDesignation() != null ? user.getDesignation().trim().toUpperCase() : "";

        if ("JSO".equals(role) || "JSO".equals(designation)) {
            return OfficerRank.ENTRY_LEVEL;
        }
        return OfficerRank.SUPERVISOR;
    }

    /**
     * Gets the current authenticated user's complete profile.
     *
     * @return UserProfileResponse of the authenticated user
     * @throws AuthenticationException if user is not authenticated
     */
    public UserProfileResponse getMyProfile() {
        User user = getCurrentUser();
        return mapUserToProfileResponse(user);
    }

    /**
     * Updates the current user's personal information.
     *
     * @param request The update request containing fields to change
     * @return Updated UserProfileResponse
     * @throws AuthenticationException if user is not authenticated
     */
    @org.springframework.transaction.annotation.Transactional
    public UserProfileResponse updatePersonalInfo(UpdatePersonalInfoRequest request) {
        User user = getCurrentUser();

        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            user.setEmail(request.getEmail());
        }
        if (request.getMobileNumber() != null && !request.getMobileNumber().isEmpty()) {
            user.setMobileNumber(request.getMobileNumber());
        }
        if (request.getResidentialAddress() != null && !request.getResidentialAddress().isEmpty()) {
            user.setResidentialAddress(request.getResidentialAddress());
        }
        if (request.getEmergencyContact() != null && !request.getEmergencyContact().isEmpty()) {
            user.setEmergencyContact(request.getEmergencyContact());
        }

        user = userRepository.save(user);
        log.info("Personal info updated for user: {}", user.getUsername());

        return mapUserToProfileResponse(user);
    }

    /**
     * Updates the current user's profile photo.
     *
     * @param photo The new photo file
     * @return Updated UserProfileResponse
     * @throws AuthenticationException if user is not authenticated
     */
    @org.springframework.transaction.annotation.Transactional
    public UserProfileResponse updatePhoto(MultipartFile photo) {
        User user = getCurrentUser();

        if (photo != null && !photo.isEmpty()) {
            // Delete old photo if it exists
            if (user.getPhotoPath() != null && !user.getPhotoPath().isEmpty()) {
                fileStorageService.deleteFile(user.getPhotoPath());
            }

            // Store new photo
            String photoPath = fileStorageService.storeFile(photo, "photos/staff");
            user.setPhotoPath(photoPath);
            user = userRepository.save(user);
            log.info("Photo updated for user: {}", user.getUsername());
        }

        return mapUserToProfileResponse(user);
    }

    /**
     * Gets all registered staff users.
     *
     * @return List of all users as UserProfileResponse
     */
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapUserToProfileResponse)
                .collect(Collectors.toList());
    }

    /**
     * Gets a specific user by ID.
     *
     * @param id The user ID
     * @return UserProfileResponse for the user
     * @throws AuthenticationException if user not found
     */
    public UserProfileResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AuthenticationException("User not found"));
        return mapUserToProfileResponse(user);
    }

    /**
     * Gets all users with a specific role.
     *
     * @param role The role to filter by
     * @return List of users with that role
     */
    public List<UserProfileResponse> getUsersByRole(String role) {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().equals(role))
                .map(this::mapUserToProfileResponse)
                .collect(Collectors.toList());
    }

    /**
     * Gets all users assigned to a specific area.
     *
     * @param area The assigned area
     * @return List of users in that area
     */
    public List<UserProfileResponse> getUsersByArea(String area) {
        return userRepository.findAll().stream()
                .filter(u -> u.getAssignedArea() != null && u.getAssignedArea().equals(area))
                .map(this::mapUserToProfileResponse)
                .collect(Collectors.toList());
    }

    /**
     * Deactivates a user account.
     *
     * @param id The user ID to deactivate
     * @throws AuthenticationException if user not found
     */
    @org.springframework.transaction.annotation.Transactional
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AuthenticationException("User not found"));
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", user.getUsername());
    }

    /**
     * Helper method to convert User entity to UserProfileResponse DTO.
     */
    private UserProfileResponse mapUserToProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole() != null ? user.getRole() : "SECURITY_OFFICER")
                .fullName(user.getFullName())
                .nicNumber(user.getNicNumber())
                .sex(user.getSex())
                .email(user.getEmail())
                .residentialAddress(user.getResidentialAddress())
                .mobileNumber(user.getMobileNumber())
                .dateOfBirth(user.getDateOfBirth())
                .emergencyContact(user.getEmergencyContact())
                .photoUrl(user.getPhotoPath())
                .professionalCertificate(user.getProfessionalCertificate())
                .assignedArea(user.getAssignedArea())
                .assignedCompany(user.getAssignedCompany())
                .joinDate(user.getJoinDate())
                .designation(user.getDesignation())
                .basicSalary(user.getBasicSalary())
                .adminPosition(user.getAdminPosition())
                .specialSkills(user.getSpecialSkills())
                .bankName(user.getBankName())
                .bankAccountNumber(user.getBankAccountNumber())
                .bankBranch(user.getBankBranch())
                .active(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Determines the redirect URL after login based on the user's role.
     * This is a merged list of roles from both old and new services.
     *
     * @param role The user's role as a String.
     * @return The path to redirect to.
     */
    private String getRedirectUrl(String role) {
        if (role == null) {
            return "/"; // Default redirect
        }
        return switch (role) {
            case "AREA_MANAGER" -> "/area-manager";
            case "OPERATIONAL_MANAGER", "OPERATION_MANAGER" -> "/operational-manager";
            case "EXECUTIVE", "EXECUTIVE_OFFICER" -> "/executive-officer";
            case "CHAIRMAN" -> "/chairman";
            case "DIRECTOR" -> "/director";
            case "ACCOUNTANT", "ACCOUNT_EXECUTIVE" -> "/account-executive";
            case "SECURITY_OFFICER", "JSO", "SSO", "LSO", "CSO" -> "/security-officer";
            default -> "/";
        };
    }
}