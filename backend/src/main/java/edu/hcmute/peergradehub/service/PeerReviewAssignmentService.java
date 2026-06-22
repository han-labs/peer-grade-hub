package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.request.peerreview.CreatePeerReviewAssignmentRequest;
import edu.hcmute.peergradehub.dto.response.peerreview.AssignPeerReviewPageResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.DeletePeerReviewAssignmentResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.PeerReviewAssignmentResponse;

public interface PeerReviewAssignmentService {

    AssignPeerReviewPageResponse getAssignPeerReviewPageData(Long assignmentId, Long lecturerId);

    PeerReviewAssignmentResponse createPeerReviewAssignment(
            Long assignmentId,
            CreatePeerReviewAssignmentRequest request,
            Long lecturerId
    );

    DeletePeerReviewAssignmentResponse deletePeerReviewAssignment(
            Long peerReviewAssignmentId,
            Long lecturerId
    );
}
