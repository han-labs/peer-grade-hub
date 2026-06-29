package edu.hcmute.peergradehub.controller.dashboard;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.response.dashboard.AdminDashboardResponse;
import edu.hcmute.peergradehub.dto.response.dashboard.LecturerDashboardResponse;
import edu.hcmute.peergradehub.dto.response.dashboard.StudentDashboardResponse;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/dashboard/admin")
    public ApiResponse<AdminDashboardResponse> getAdminDashboard(
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(dashboardService.getAdminDashboard(currentUserId(principal)));
    }

    @GetMapping("/dashboard/lecturer")
    public ApiResponse<LecturerDashboardResponse> getLecturerDashboard(
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(dashboardService.getLecturerDashboard(currentUserId(principal)));
    }

    @GetMapping("/dashboard/student")
    public ApiResponse<StudentDashboardResponse> getStudentDashboard(
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(dashboardService.getStudentDashboard(currentUserId(principal)));
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
