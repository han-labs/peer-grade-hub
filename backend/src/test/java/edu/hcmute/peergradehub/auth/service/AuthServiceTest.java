package edu.hcmute.peergradehub.auth.service;

import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.request.auth.LoginRequest;
import edu.hcmute.peergradehub.dto.response.auth.LoginResponse;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.mapper.AuthMapper;
import edu.hcmute.peergradehub.security.JwtTokenProvider;
import edu.hcmute.peergradehub.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserDao userDao;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    private PasswordEncoder passwordEncoder;
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthServiceImpl(userDao, passwordEncoder, jwtTokenProvider, new AuthMapper());
    }

    @Test
    void login_Success_ByUsername() {
        User user = activeUser();
        when(userDao.findByUsernameOrEmail("student01", "student01")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateToken(user, false)).thenReturn("jwt-token");
        when(jwtTokenProvider.getExpirationMs(false)).thenReturn(86400000L);

        LoginResponse response = authService.login(new LoginRequest("student01", "Student@123", false));

        assertEquals("jwt-token", response.token());
        assertEquals("Bearer", response.tokenType());
        assertEquals(86400000L, response.expiresIn());
        assertEquals(UserRole.STUDENT, response.user().role());
        assertEquals("/student", response.dashboardPath());
    }

    @Test
    void login_Success_ByEmail() {
        User user = activeUser();
        when(userDao.findByUsernameOrEmail("student01@peergrade.test", "student01@peergrade.test")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateToken(user, true)).thenReturn("remember-token");
        when(jwtTokenProvider.getExpirationMs(true)).thenReturn(604800000L);

        LoginResponse response = authService.login(new LoginRequest("student01@peergrade.test", "Student@123", true));

        assertEquals("remember-token", response.token());
        assertEquals(604800000L, response.expiresIn());
        assertEquals("student01@peergrade.test", response.user().email());
    }

    @Test
    void login_ThrowsBadRequest_WhenCredentialsMissing() {
        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> authService.login(new LoginRequest(" ", "", false)));

        assertEquals(AuthServiceImpl.MISSING_CREDENTIALS_MESSAGE, exception.getMessage());
        verifyNoInteractions(userDao, jwtTokenProvider);
    }

    @Test
    void login_ThrowsUnauthorized_WhenPasswordInvalid() {
        User user = activeUser();
        when(userDao.findByUsernameOrEmail("student01", "student01")).thenReturn(Optional.of(user));

        UnauthorizedException exception = assertThrows(UnauthorizedException.class,
                () -> authService.login(new LoginRequest("student01", "wrong-password", false)));

        assertEquals(AuthServiceImpl.INVALID_CREDENTIALS_MESSAGE, exception.getMessage());
        verify(jwtTokenProvider, never()).generateToken(any(), anyBoolean());
    }

    @Test
    void login_ThrowsForbidden_WhenAccountInactive() {
        User user = user(UserStatus.INACTIVE, UserRole.STUDENT);
        when(userDao.findByUsernameOrEmail("student01", "student01")).thenReturn(Optional.of(user));

        ForbiddenException exception = assertThrows(ForbiddenException.class,
                () -> authService.login(new LoginRequest("student01", "Student@123", false)));

        assertEquals(AuthServiceImpl.LOCKED_OR_INACTIVE_MESSAGE, exception.getMessage());
        verify(jwtTokenProvider, never()).generateToken(any(), anyBoolean());
    }

    @Test
    void login_ThrowsForbidden_WhenAccountLocked() {
        User user = user(UserStatus.LOCKED, UserRole.STUDENT);
        when(userDao.findByUsernameOrEmail("student01", "student01")).thenReturn(Optional.of(user));

        ForbiddenException exception = assertThrows(ForbiddenException.class,
                () -> authService.login(new LoginRequest("student01", "Student@123", false)));

        assertEquals(AuthServiceImpl.LOCKED_OR_INACTIVE_MESSAGE, exception.getMessage());
        verify(jwtTokenProvider, never()).generateToken(any(), anyBoolean());
    }

    @Test
    void login_ThrowsForbidden_WhenNoRoleAssigned() {
        User user = user(UserStatus.ACTIVE, null);
        when(userDao.findByUsernameOrEmail("student01", "student01")).thenReturn(Optional.of(user));

        ForbiddenException exception = assertThrows(ForbiddenException.class,
                () -> authService.login(new LoginRequest("student01", "Student@123", false)));

        assertEquals(AuthServiceImpl.NO_ROLE_MESSAGE, exception.getMessage());
        verify(jwtTokenProvider, never()).generateToken(any(), anyBoolean());
    }

    @Test
    void login_ThrowsUnauthorized_WhenUserNotFound() {
        when(userDao.findByUsernameOrEmail("missing", "missing")).thenReturn(Optional.empty());

        UnauthorizedException exception = assertThrows(UnauthorizedException.class,
                () -> authService.login(new LoginRequest("missing", "Student@123", false)));

        assertEquals(AuthServiceImpl.INVALID_CREDENTIALS_MESSAGE, exception.getMessage());
    }

    private User activeUser() {
        return user(UserStatus.ACTIVE, UserRole.STUDENT);
    }

    private User user(UserStatus status, UserRole role) {
        return User.builder()
                .id(3L)
                .username("student01")
                .email("student01@peergrade.test")
                .passwordHash(passwordEncoder.encode("Student@123"))
                .fullName("Demo Student")
                .userRole(role)
                .status(status)
                .build();
    }
}
