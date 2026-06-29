package edu.hcmute.peergradehub.controller.course;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.request.course.CreateLessonMaterialRequest;
import edu.hcmute.peergradehub.dto.response.course.LessonMaterialResponse;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.LessonMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LessonMaterialController {

    private final LessonMaterialService lessonMaterialService;

    @PostMapping("/courses/{courseId}/lessons/{lessonId}/materials")
    public ResponseEntity<ApiResponse<LessonMaterialResponse>> createLessonMaterial(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestBody CreateLessonMaterialRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        LessonMaterialResponse response = lessonMaterialService.createLessonMaterial(courseId, lessonId, request, currentUserId(principal));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Material created successfully.", response));
    }

    @PutMapping("/courses/{courseId}/lessons/{lessonId}/materials/{materialId}")
    public ApiResponse<LessonMaterialResponse> updateLessonMaterial(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @PathVariable Long materialId,
            @RequestBody CreateLessonMaterialRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        LessonMaterialResponse response = lessonMaterialService.updateLessonMaterial(courseId, lessonId, materialId, request, currentUserId(principal));
        return ApiResponse.success("Lesson material updated successfully.", response);
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }

    @DeleteMapping("/courses/{courseId}/lessons/{lessonId}/materials/{materialId}")
    public ApiResponse<Void> deleteLessonMaterial(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @PathVariable Long materialId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        lessonMaterialService.deleteLessonMaterial(courseId, lessonId, materialId, currentUserId(principal));
        return ApiResponse.success("Lesson material deleted successfully.", null);
    }
}
