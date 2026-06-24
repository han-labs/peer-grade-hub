package edu.hcmute.peergradehub.controller.peerreview;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.request.peerreview.SubmitPeerReviewRequest;
import edu.hcmute.peergradehub.dto.response.peerreview.PeerReviewDetailResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.SubmitPeerReviewResponse;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.PeerReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/peer-reviews/tasks")
public class PeerReviewController {

    private final PeerReviewService peerReviewService;

    @GetMapping("/{id}")
    public ApiResponse<PeerReviewDetailResponse> getReviewTask(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(
                peerReviewService.getReviewTask(id, currentUserId(principal))
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<SubmitPeerReviewResponse> submitReview(
            @PathVariable Long id,
            @RequestBody SubmitPeerReviewRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success(
                "Peer review submitted successfully.",
                peerReviewService.submitReview(id, request, currentUserId(principal))
        );
    }

    private Long currentUserId(CustomUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
