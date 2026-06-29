package edu.hcmute.peergradehub.controller.lesson;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.request.course.CreateAssignmentRequest;
import edu.hcmute.peergradehub.dto.response.lesson.AssignmentDetailResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.AssignmentService;
import edu.hcmute.peergradehub.mapper.LessonMapper;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final LessonMapper lessonMapper;

    @PostMapping("/lessons/{lessonId}/assignments")
    public ResponseEntity<ApiResponse<AssignmentDetailResponse>> createAssignment(
            @PathVariable Long lessonId,
            @RequestBody CreateAssignmentRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        Assignment assignment = assignmentService.createAssignment(lessonId, request, currentUserId(principal));
        AssignmentDetailResponse response = lessonMapper.toAssignmentDetailResponse(assignment);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Assignment created successfully.", response));
    }

    @PutMapping("/assignments/{assignmentId}")
    public ApiResponse<AssignmentDetailResponse> updateAssignment(
            @PathVariable Long assignmentId,
            @RequestBody CreateAssignmentRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        Assignment assignment = assignmentService.updateAssignment(assignmentId, request, currentUserId(principal));
        AssignmentDetailResponse response = lessonMapper.toAssignmentDetailResponse(assignment);
        return ApiResponse.success("Assignment updated successfully.", response);
    }

    @GetMapping("/assignments/{assignmentId}")
    public ApiResponse<AssignmentDetailResponse> getAssignmentDetail(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        AssignmentDetailResponse detail = assignmentService.getAssignmentDetail(assignmentId, currentUserId(principal));
        return ApiResponse.success(detail);
    }

    @DeleteMapping("/assignments/{assignmentId}")
    public ApiResponse<Void> deleteAssignment(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        assignmentService.deleteAssignment(assignmentId, currentUserId(principal));
        return ApiResponse.success("Assignment deleted successfully.", null);
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
