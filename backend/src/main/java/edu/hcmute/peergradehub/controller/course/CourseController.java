package edu.hcmute.peergradehub.controller.course;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.request.course.CreateCourseRequest;
import edu.hcmute.peergradehub.dto.request.course.UpdateCourseRequest;
import edu.hcmute.peergradehub.dto.response.course.CourseSummaryResponse;
import edu.hcmute.peergradehub.dto.response.course.CourseWorkspaceResponse;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.CourseService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping("/courses")
    public ApiResponse<List<CourseSummaryResponse>> getLecturerCourses(
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(courseService.getLecturerCourses(currentUserId(principal)));
    }

    @PostMapping("/courses")
    public ResponseEntity<ApiResponse<CourseWorkspaceResponse>> createCourse(
            @RequestBody CreateCourseRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        CourseWorkspaceResponse response = courseService.createCourse(request, currentUserId(principal));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Course created successfully.", response));
    }

    @GetMapping("/courses/{courseId}/workspace")
    public ApiResponse<CourseWorkspaceResponse> getCourseWorkspace(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(courseService.getCourseWorkspace(courseId, currentUserId(principal)));
    }

    @PutMapping("/courses/{courseId}")
    public ApiResponse<CourseWorkspaceResponse> updateCourse(
            @PathVariable Long courseId,
            @RequestBody UpdateCourseRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Course updated successfully.", courseService.updateCourse(courseId, request, currentUserId(principal)));
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }

    @GetMapping("/courses/active")
    public ApiResponse<List<CourseSummaryResponse>> getActiveCourses(
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(courseService.getActiveCourses(currentUserId(principal)));
    }
}
