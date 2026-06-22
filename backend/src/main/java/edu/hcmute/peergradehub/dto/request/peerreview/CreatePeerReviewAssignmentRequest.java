package edu.hcmute.peergradehub.dto.request.peerreview;

public record CreatePeerReviewAssignmentRequest(
        Long reviewerGroupId,
        Long targetGroupId
) {
}
