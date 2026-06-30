package edu.hcmute.peergradehub.controller.student;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.request.submission.SubmitAssignmentRequest;
import edu.hcmute.peergradehub.dto.response.submission.AssignmentSubmissionPageResponse;
import edu.hcmute.peergradehub.dto.response.submission.AssignmentSubmissionResponse;
import edu.hcmute.peergradehub.dto.response.submission.StudentSubmittableAssignmentResponse;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.StudentSubmissionFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/student")
public class StudentSubmissionController {

    private final StudentSubmissionFacade studentSubmissionFacade;

    @GetMapping("/assignments/submittable")
    public ApiResponse<List<StudentSubmittableAssignmentResponse>> getSubmittableAssignments(
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(
                studentSubmissionFacade.getSubmittableAssignments(currentUserId(principal))
        );
    }

    @GetMapping("/assignments/{assignmentId}/submission")
    public ApiResponse<AssignmentSubmissionPageResponse> getSubmissionPage(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(
                studentSubmissionFacade.getSubmissionPage(assignmentId, currentUserId(principal))
        );
    }

    @PostMapping("/assignments/{assignmentId}/submission")
    public ApiResponse<AssignmentSubmissionResponse> submitAssignment(
            @PathVariable Long assignmentId,
            @RequestBody SubmitAssignmentRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        AssignmentSubmissionResponse response = studentSubmissionFacade.submitAssignment(
                assignmentId,
                request,
                currentUserId(principal)
        );
        return ApiResponse.success(response.message(), response);
    }

    @PostMapping("/assignments/{assignmentId}/submission/files")
    public ApiResponse<AssignmentSubmissionResponse> uploadSubmissionFiles(
            @PathVariable Long assignmentId,
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        AssignmentSubmissionResponse response = studentSubmissionFacade.uploadSubmissionFiles(
                assignmentId,
                files,
                currentUserId(principal)
        );
        return ApiResponse.success(response.message(), response);
    }

    @GetMapping("/assignments/{assignmentId}/submission/current")
    public ApiResponse<AssignmentSubmissionResponse> getMySubmission(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(
                studentSubmissionFacade.getMySubmission(assignmentId, currentUserId(principal))
        );
    }

    @GetMapping("/courses/{courseId}/assignments/{assignmentId}/submission")
    public ApiResponse<AssignmentSubmissionResponse> getMyCourseSubmission(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(
                studentSubmissionFacade.getMySubmission(courseId, assignmentId, currentUserId(principal))
        );
    }

    @GetMapping("/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}")
    public ApiResponse<AssignmentSubmissionResponse> getSubmissionDetail(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @PathVariable Long submissionId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(
                studentSubmissionFacade.getSubmissionDetail(
                        courseId,
                        assignmentId,
                        submissionId,
                        currentUserId(principal)
                )
        );
    }

    @DeleteMapping("/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}")
    public ApiResponse<Void> deleteSubmission(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @PathVariable Long submissionId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        studentSubmissionFacade.deleteSubmission(
                courseId,
                assignmentId,
                submissionId,
                currentUserId(principal)
        );
        return ApiResponse.success("Submission deleted successfully.");
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
