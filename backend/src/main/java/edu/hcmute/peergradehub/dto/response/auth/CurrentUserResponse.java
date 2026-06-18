package edu.hcmute.peergradehub.dto.response.auth;

import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;

public record CurrentUserResponse(
        Long id,
        String username,
        String email,
        String fullName,
        UserRole role,
        UserStatus status
) {
}
