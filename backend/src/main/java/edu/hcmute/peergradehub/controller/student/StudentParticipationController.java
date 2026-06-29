package edu.hcmute.peergradehub.controller.student;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.response.student.GroupSelectionResponse;
import edu.hcmute.peergradehub.dto.response.student.InvitationPreviewResponse;
import edu.hcmute.peergradehub.dto.response.student.JoinCourseResponse;
import edu.hcmute.peergradehub.dto.response.student.JoinGroupResponse;
import edu.hcmute.peergradehub.dto.response.student.LeaveGroupResponse;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.StudentParticipationFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentParticipationController {

    private final StudentParticipationFacade studentParticipationFacade;

    @GetMapping("/invitations/{invitationCode}")
    public ApiResponse<InvitationPreviewResponse> previewInvitation(
            @PathVariable String invitationCode,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(studentParticipationFacade.previewInvitation(invitationCode, currentUserId(principal)));
    }

    @PostMapping("/invitations/{invitationCode}/join")
    public ApiResponse<JoinCourseResponse> joinCourse(
            @PathVariable String invitationCode,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(studentParticipationFacade.joinCourse(invitationCode, currentUserId(principal)));
    }

    @GetMapping("/courses/{courseId}/groups")
    public ApiResponse<GroupSelectionResponse> getGroupSelection(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(studentParticipationFacade.getGroupSelection(courseId, currentUserId(principal)));
    }

    @PostMapping("/courses/{courseId}/groups/{groupId}/join")
    public ApiResponse<JoinGroupResponse> joinGroup(
            @PathVariable Long courseId,
            @PathVariable Long groupId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(studentParticipationFacade.joinGroup(courseId, groupId, currentUserId(principal)));
    }

    @DeleteMapping("/courses/{courseId}/groups/leave")
    public ApiResponse<LeaveGroupResponse> leaveGroup(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(studentParticipationFacade.leaveGroup(courseId, currentUserId(principal)));
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
