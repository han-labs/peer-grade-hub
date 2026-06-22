package edu.hcmute.peergradehub.dto.response.peerreview;

import edu.hcmute.peergradehub.enumeration.GroupStatus;

public record PeerReviewGroupOptionResponse(
        Long id,
        String name,
        GroupStatus status
) {
}
