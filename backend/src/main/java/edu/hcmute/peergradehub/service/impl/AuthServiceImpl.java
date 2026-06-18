package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.request.auth.LoginRequest;
import edu.hcmute.peergradehub.dto.response.auth.CurrentUserResponse;
import edu.hcmute.peergradehub.dto.response.auth.LoginResponse;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.mapper.AuthMapper;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements edu.hcmute.peergradehub.service.AuthService {

    public static final String MISSING_CREDENTIALS_MESSAGE =
            "Username and password are required. Please enter your login information.";
    public static final String INVALID_CREDENTIALS_MESSAGE =
            "Login failed. Please check your username or password and try again.";
    public static final String LOCKED_OR_INACTIVE_MESSAGE =
            "Your account is locked or inactive. Please contact the administrator.";
    public static final String NO_ROLE_MESSAGE =
            "Your account does not have an assigned role. Please contact the administrator.";

    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthMapper authMapper;

    @Override
    public LoginResponse login(LoginRequest request) {
        if (request == null || isBlank(request.usernameOrEmail()) || isBlank(request.password())) {
            throw new BadRequestException(MISSING_CREDENTIALS_MESSAGE);
        }

        String usernameOrEmail = request.usernameOrEmail().trim();
        User user = userDao.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
        }

        if (!user.isActiveAccount()) {
            throw new ForbiddenException(LOCKED_OR_INACTIVE_MESSAGE);
        }

        if (!user.hasAssignedRole()) {
            throw new ForbiddenException(NO_ROLE_MESSAGE);
        }

        String token = jwtTokenProvider.generateToken(user, request.rememberMeOrDefault());
        long expiresIn = jwtTokenProvider.getExpirationMs(request.rememberMeOrDefault());
        return authMapper.toLoginResponse(user, token, expiresIn);
    }

    @Override
    public CurrentUserResponse getCurrentUser(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return authMapper.toCurrentUserResponse(principal);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
