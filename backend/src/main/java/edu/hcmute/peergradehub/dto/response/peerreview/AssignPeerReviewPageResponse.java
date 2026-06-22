package edu.hcmute.peergradehub.dto.response.peerreview;

import java.util.List;

public record AssignPeerReviewPageResponse(
        AssignmentPeerReviewSummaryResponse assignment,
        List<PeerReviewGroupOptionResponse> groups,
        List<PeerReviewAssignmentResponse> peerReviewAssignments,
        List<PeerReviewGroupOptionResponse> groupsWithoutReceivedReviews
) {
}
