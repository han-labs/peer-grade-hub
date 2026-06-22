package edu.hcmute.peergradehub.controller.peerreview;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.request.peerreview.CreatePeerReviewAssignmentRequest;
import edu.hcmute.peergradehub.dto.response.peerreview.AssignPeerReviewPageResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.DeletePeerReviewAssignmentResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.PeerReviewAssignmentResponse;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.PeerReviewAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class PeerReviewAssignmentController {

    private static final String CREATE_SUCCESS_MESSAGE =
            "Peer review assignment created successfully.";
    private static final String DELETE_SUCCESS_MESSAGE =
            "Peer review assignment deleted successfully.";

    private final PeerReviewAssignmentService peerReviewAssignmentService;

    @GetMapping("/assignments/{assignmentId}/peer-review-assignments")
    public ApiResponse<AssignPeerReviewPageResponse> getPeerReviewAssignments(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(
                peerReviewAssignmentService.getAssignPeerReviewPageData(
                        assignmentId,
                        currentUserId(principal)
                )
        );
    }

    @PostMapping("/assignments/{assignmentId}/peer-review-assignments")
    public ResponseEntity<ApiResponse<PeerReviewAssignmentResponse>> createPeerReviewAssignment(
            @PathVariable Long assignmentId,
            @RequestBody CreatePeerReviewAssignmentRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        PeerReviewAssignmentResponse response = peerReviewAssignmentService.createPeerReviewAssignment(
                assignmentId,
                request,
                currentUserId(principal)
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(CREATE_SUCCESS_MESSAGE, response));
    }

    @DeleteMapping("/peer-review-assignments/{peerReviewAssignmentId}")
    public ApiResponse<DeletePeerReviewAssignmentResponse> deletePeerReviewAssignment(
            @PathVariable Long peerReviewAssignmentId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(
                DELETE_SUCCESS_MESSAGE,
                peerReviewAssignmentService.deletePeerReviewAssignment(
                        peerReviewAssignmentId,
                        currentUserId(principal)
                )
        );
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
