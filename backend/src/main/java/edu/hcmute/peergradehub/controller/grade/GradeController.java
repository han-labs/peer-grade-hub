package edu.hcmute.peergradehub.controller.grade;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.request.grade.PublishGradeRequest;
import edu.hcmute.peergradehub.dto.request.grade.SaveDraftGradeRequest;
import edu.hcmute.peergradehub.dto.request.grade.ToggleShowcaseRequest;
import edu.hcmute.peergradehub.dto.request.grade.UnpublishGradeRequest;
import edu.hcmute.peergradehub.dto.response.grade.GradeDraftResponse;
import edu.hcmute.peergradehub.dto.response.grade.GradingDataResponse;
import edu.hcmute.peergradehub.dto.response.grade.PublishGradeResponse;
import edu.hcmute.peergradehub.dto.response.grade.ShowcaseStatusResponse;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller for Grade Management (UC-09 Manage Final Grades).
 * Thin controller - delegates all business logic to GradeService.
 */
@RestController
@RequestMapping("/grades")
@RequiredArgsConstructor
@Slf4j
public class GradeController {

    private final GradeService gradeService;

    /**
     * Get all grading data for an assignment.
     * Main Flow Step 1.
     * 
     * GET /api/grades/assignment/{assignmentId}
     */
    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<ApiResponse<GradingDataResponse>> getGradingData(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        log.info("GET /api/grades/assignment/{} - lecturer: {}", assignmentId, principal.getUsername());
        
        GradingDataResponse response = gradeService.getGradingData(assignmentId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Publish grades for selected groups.
     * Main Flow Step 2.
     * 
     * POST /api/grades/publish
     */
    @PostMapping("/publish")
    public ResponseEntity<ApiResponse<PublishGradeResponse>> publishGrades(
            @Valid @RequestBody PublishGradeRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        log.info("POST /api/grades/publish - assignment: {}, groups: {}, lecturer: {}", 
                request.getAssignmentId(), request.getGroupIds(), principal.getUsername());
        
        PublishGradeResponse response = gradeService.publishGrades(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Save grade as draft.
     * Alternate Flow 2a.
     * 
     * POST /api/grades/draft
     */
    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<GradeDraftResponse>> saveDraft(
            @Valid @RequestBody SaveDraftGradeRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        log.info("POST /api/grades/draft - assignment: {}, group: {}, lecturer: {}", 
                request.getAssignmentId(), request.getGroupId(), principal.getUsername());
        
        GradeDraftResponse response = gradeService.saveDraft(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Unpublish a previously published grade.
     * Alternate Flow 3b.
     * 
     * POST /api/grades/unpublish
     */
    @PostMapping("/unpublish")
    public ResponseEntity<ApiResponse<GradeDraftResponse>> unpublishGrade(
            @Valid @RequestBody UnpublishGradeRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        log.info("POST /api/grades/unpublish - assignment: {}, group: {}, lecturer: {}", 
                request.getAssignmentId(), request.getGroupId(), principal.getUsername());
        
        GradeDraftResponse response = gradeService.unpublishGrade(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Toggle Public Showcase Mode.
     * Main Flow Step 3-4.
     * 
     * POST /api/grades/showcase
     */
    @PostMapping("/showcase")
    public ResponseEntity<ApiResponse<ShowcaseStatusResponse>> toggleShowcase(
            @Valid @RequestBody ToggleShowcaseRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        log.info("POST /api/grades/showcase - assignment: {}, enabled: {}, lecturer: {}", 
                request.getAssignmentId(), request.getEnabled(), principal.getUsername());
        
        ShowcaseStatusResponse response = gradeService.toggleShowcase(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}