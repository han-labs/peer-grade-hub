package edu.hcmute.peergradehub.mapper;

import edu.hcmute.peergradehub.dto.response.peerreview.AssignPeerReviewPageResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.AssignmentPeerReviewSummaryResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.PeerReviewAssignmentResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.PeerReviewGroupOptionResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PeerReviewAssignmentMapper {

    public AssignmentPeerReviewSummaryResponse toAssignmentSummary(
            Assignment assignment,
            Course course,
            boolean reviewDeadlineOpen
    ) {
        return new AssignmentPeerReviewSummaryResponse(
                assignment.getId(),
                assignment.getTitle(),
                course.getId(),
                course.getCourseName(),
                course.getClassCode(),
                assignment.getReviewDeadline(),
                reviewDeadlineOpen
        );
    }

    public PeerReviewGroupOptionResponse toGroupOption(StudentGroup group) {
        return new PeerReviewGroupOptionResponse(
                group.getId(),
                group.getGroupName(),
                group.getGroupStatus()
        );
    }

    public PeerReviewAssignmentResponse toResponse(PeerReviewAssignment peerReviewAssignment) {
        return new PeerReviewAssignmentResponse(
                peerReviewAssignment.getId(),
                peerReviewAssignment.getAssignment().getId(),
                toGroupOption(peerReviewAssignment.getReviewerGroup()),
                toGroupOption(peerReviewAssignment.getRevieweeGroup()),
                peerReviewAssignment.getReviewAssignmentStatus(),
                peerReviewAssignment.getAssignedBy() == null
                        ? null
                        : peerReviewAssignment.getAssignedBy().getId(),
                peerReviewAssignment.getAssignedAt(),
                peerReviewAssignment.getDueAt()
        );
    }

    public AssignPeerReviewPageResponse toPageResponse(
            Assignment assignment,
            Course course,
            boolean reviewDeadlineOpen,
            List<StudentGroup> groups,
            List<PeerReviewAssignment> peerReviewAssignments,
            List<StudentGroup> groupsWithoutReceivedReviews
    ) {
        return new AssignPeerReviewPageResponse(
                toAssignmentSummary(assignment, course, reviewDeadlineOpen),
                groups.stream().map(this::toGroupOption).toList(),
                peerReviewAssignments.stream().map(this::toResponse).toList(),
                groupsWithoutReceivedReviews.stream().map(this::toGroupOption).toList()
        );
    }
}
