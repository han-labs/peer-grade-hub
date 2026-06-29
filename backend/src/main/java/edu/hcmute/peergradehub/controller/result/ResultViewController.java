package edu.hcmute.peergradehub.controller.result;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.response.course.CourseSummaryResponse;
import edu.hcmute.peergradehub.dto.response.course.LessonResponse;
import edu.hcmute.peergradehub.dto.response.lesson.LessonAssignmentsResponse;
import edu.hcmute.peergradehub.dto.response.result.PublishedResultResponse;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.CourseService;
import edu.hcmute.peergradehub.service.LessonService;
import edu.hcmute.peergradehub.service.ResultViewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import edu.hcmute.peergradehub.service.AssignmentService;
import java.util.List;

@RestController
@RequestMapping("/results")
@RequiredArgsConstructor
@Slf4j
public class ResultViewController {

    private final ResultViewService resultViewService;
    private final CourseService courseService;
    private final LessonService lessonService;
    private final AssignmentService assignmentService;
    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<ApiResponse<PublishedResultResponse>> getPublishedResults(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long assignmentId) {

        log.info("GET /results/assignment/{} - student: {}", assignmentId, principal.getUsername());

        PublishedResultResponse response = resultViewService.getPublishedResults(
                principal.getId(),
                assignmentId
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }
    // ===== STUDENT NAVIGATION: Courses =====
    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<CourseSummaryResponse>>> getStudentCourses(
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        log.info("GET /results/courses - student: {}", principal.getUsername());
        
        List<CourseSummaryResponse> courses = courseService.getStudentActiveCourses(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    // ===== STUDENT NAVIGATION: Lessons =====
    @GetMapping("/courses/{courseId}/lessons")
    public ResponseEntity<ApiResponse<List<LessonResponse>>> getStudentLessons(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        log.info("GET /results/courses/{}/lessons - student: {}", courseId, principal.getUsername());
        
        List<LessonResponse> lessons = lessonService.getStudentLessons(courseId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    // ===== STUDENT NAVIGATION: Assignments =====
    @GetMapping("/lessons/{lessonId}/assignments")
    public ResponseEntity<ApiResponse<LessonAssignmentsResponse>> getStudentAssignments(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        log.info("GET /results/lessons/{}/assignments - student: {}", lessonId, principal.getUsername());
        
        LessonAssignmentsResponse response = assignmentService.getStudentAssignments(lessonId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}