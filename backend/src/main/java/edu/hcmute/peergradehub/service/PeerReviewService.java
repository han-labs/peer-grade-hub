package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.request.peerreview.SubmitPeerReviewRequest;
import edu.hcmute.peergradehub.dto.response.peerreview.PeerReviewDetailResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.SubmitPeerReviewResponse;

public interface PeerReviewService {

    PeerReviewDetailResponse getReviewTask(Long reviewTaskId, Long studentId);

    SubmitPeerReviewResponse submitReview(
            Long reviewTaskId,
            SubmitPeerReviewRequest request,
            Long studentId
    );
}
