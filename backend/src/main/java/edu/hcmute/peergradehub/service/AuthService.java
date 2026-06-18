package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.request.auth.LoginRequest;
import edu.hcmute.peergradehub.dto.response.auth.CurrentUserResponse;
import edu.hcmute.peergradehub.dto.response.auth.LoginResponse;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;

public interface AuthService {
    LoginResponse login(LoginRequest request);

    CurrentUserResponse getCurrentUser(CustomUserPrincipal principal);
}
