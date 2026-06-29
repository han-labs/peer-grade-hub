package edu.hcmute.peergradehub.controller.course;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.request.course.CreateLessonRequest;
import edu.hcmute.peergradehub.dto.response.course.LessonResponse;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @PostMapping("/courses/{courseId}/lessons")
    public ResponseEntity<ApiResponse<LessonResponse>> createLesson(
            @PathVariable Long courseId,
            @RequestBody CreateLessonRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        LessonResponse response = lessonService.createLesson(courseId, request, currentUserId(principal));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lesson created successfully.", response));
    }

    @PutMapping("/courses/{courseId}/lessons/{lessonId}")
    public ApiResponse<LessonResponse> updateLesson(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestBody CreateLessonRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        LessonResponse response = lessonService.updateLesson(courseId, lessonId, request, currentUserId(principal));
        return ApiResponse.success("Lesson updated successfully.", response);
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }

    @DeleteMapping("/courses/{courseId}/lessons/{lessonId}")
    public ApiResponse<Void> deleteLesson(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        lessonService.deleteLesson(courseId, lessonId, currentUserId(principal));
        return ApiResponse.success("Lesson deleted successfully.", null);
    }
}
