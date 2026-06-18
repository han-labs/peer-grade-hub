package edu.hcmute.peergradehub.mapper;

import edu.hcmute.peergradehub.dto.response.auth.CurrentUserResponse;
import edu.hcmute.peergradehub.dto.response.auth.LoginResponse;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public CurrentUserResponse toCurrentUserResponse(User user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getUserRole(),
                user.getStatus()
        );
    }

    public CurrentUserResponse toCurrentUserResponse(CustomUserPrincipal principal) {
        return new CurrentUserResponse(
                principal.getId(),
                principal.getUsername(),
                principal.getEmail(),
                principal.getFullName(),
                principal.getUserRole(),
                principal.getStatus()
        );
    }

    public LoginResponse toLoginResponse(User user, String token, long expiresIn) {
        return new LoginResponse(
                token,
                "Bearer",
                expiresIn,
                toCurrentUserResponse(user),
                dashboardPath(user.getUserRole())
        );
    }

    private String dashboardPath(UserRole role) {
        if (role == UserRole.STUDENT) {
            return "/student";
        }
        if (role == UserRole.LECTURER) {
            return "/lecturer";
        }
        if (role == UserRole.ADMINISTRATOR) {
            return "/admin";
        }
        return "/";
    }
}
