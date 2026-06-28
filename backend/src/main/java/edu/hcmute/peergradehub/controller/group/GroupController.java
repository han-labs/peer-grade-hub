package edu.hcmute.peergradehub.controller.group;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.request.group.AddGroupsRequest;
import edu.hcmute.peergradehub.dto.request.group.GenerateGroupsRequest;
import edu.hcmute.peergradehub.dto.request.group.UpdateGroupDeadlineRequest;
import edu.hcmute.peergradehub.dto.request.group.UpdateMaxGroupSizeRequest;
import edu.hcmute.peergradehub.dto.response.group.GroupActionResponse;
import edu.hcmute.peergradehub.dto.response.group.GroupManagementResponse;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/courses/{courseId}/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ApiResponse<GroupManagementResponse> getGroupManagement(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(groupService.getGroupManagement(courseId, currentUserId(principal)));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<GroupManagementResponse>> generateGroups(
            @PathVariable Long courseId,
            @RequestBody GenerateGroupsRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        GroupManagementResponse response = groupService.generateGroups(courseId, request, currentUserId(principal));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Groups generated successfully.", response));
    }

    @PutMapping("/deadline")
    public ApiResponse<GroupManagementResponse> updateGroupDeadline(
            @PathVariable Long courseId,
            @RequestBody UpdateGroupDeadlineRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        GroupManagementResponse response = groupService.updateGroupFormationDeadline(courseId, request, currentUserId(principal));
        return ApiResponse.success("Group formation deadline updated successfully.", response);
    }

    @DeleteMapping("/{groupId}/members/{groupMemberId}")
    public ApiResponse<GroupManagementResponse> removeGroupMember(
            @PathVariable Long courseId,
            @PathVariable Long groupId,
            @PathVariable Long groupMemberId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        GroupActionResponse response = groupService.removeGroupMember(courseId, groupId, groupMemberId, currentUserId(principal));
        return ApiResponse.success(response.message(), response.groupManagement());
    }

    @PutMapping("/lock")
    public ApiResponse<GroupManagementResponse> lockAllGroups(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        GroupActionResponse response = groupService.lockAllGroups(courseId, currentUserId(principal));
        return ApiResponse.success(response.message(), response.groupManagement());
    }

    @PutMapping("/unlock")
    public ApiResponse<GroupManagementResponse> unlockGroups(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        GroupActionResponse response = groupService.unlockGroups(courseId, currentUserId(principal));
        return ApiResponse.success(response.message(), response.groupManagement());
    }

    @PostMapping("/add")
    public ApiResponse<GroupManagementResponse> addGroups(
            @PathVariable Long courseId,
            @RequestBody AddGroupsRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        GroupActionResponse response = groupService.addGroups(courseId, request, currentUserId(principal));
        return ApiResponse.success(response.message(), response.groupManagement());
    }

    @PutMapping("/max-size")
    public ApiResponse<GroupManagementResponse> updateMaxGroupSize(
            @PathVariable Long courseId,
            @RequestBody UpdateMaxGroupSizeRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        GroupActionResponse response = groupService.updateMaxGroupSize(courseId, request, currentUserId(principal));
        return ApiResponse.success(response.message(), response.groupManagement());
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
