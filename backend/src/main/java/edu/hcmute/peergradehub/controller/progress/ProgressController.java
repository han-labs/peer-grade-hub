package edu.hcmute.peergradehub.controller.progress;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.response.progress.FilteredProgressGroupsResponse;
import edu.hcmute.peergradehub.dto.response.progress.GroupMonitoringDetailResponse;
import edu.hcmute.peergradehub.dto.response.progress.ProgressDashboardResponse;
import edu.hcmute.peergradehub.enumeration.ProgressFilter;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@RestController
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/courses/{courseId}/assignments/{assignmentId}/progress")
    public ApiResponse<ProgressDashboardResponse> getMonitoringDashboard(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(progressService.getMonitoringDashboard(
                courseId,
                assignmentId,
                currentUserId(principal)
        ));
    }

    @GetMapping("/courses/{courseId}/assignments/{assignmentId}/progress/groups")
    public ApiResponse<FilteredProgressGroupsResponse> getFilteredMonitoringGroups(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @RequestParam(defaultValue = "ALL") String filter,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(progressService.getFilteredMonitoringGroups(
                courseId,
                assignmentId,
                parseFilter(filter),
                currentUserId(principal)
        ));
    }

    @GetMapping("/assignments/{assignmentId}/progress/groups/{groupId}")
    public ApiResponse<GroupMonitoringDetailResponse> getGroupMonitoringDetails(
            @PathVariable Long assignmentId,
            @PathVariable Long groupId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(progressService.getGroupMonitoringDetails(
                assignmentId,
                groupId,
                currentUserId(principal)
        ));
    }

    private ProgressFilter parseFilter(String filter) {
        try {
            return ProgressFilter.valueOf(filter.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new BadRequestException();
        }
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
