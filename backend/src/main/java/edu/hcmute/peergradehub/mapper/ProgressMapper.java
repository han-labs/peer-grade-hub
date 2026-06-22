package edu.hcmute.peergradehub.mapper;

import edu.hcmute.peergradehub.dto.response.progress.AssignmentProgressSummaryResponse;
import edu.hcmute.peergradehub.dto.response.progress.CourseProgressSummaryResponse;
import edu.hcmute.peergradehub.dto.response.progress.GroupMonitoringDetailResponse;
import edu.hcmute.peergradehub.dto.response.progress.GroupProgressSummaryResponse;
import edu.hcmute.peergradehub.dto.response.progress.MonitoredGroupResponse;
import edu.hcmute.peergradehub.dto.response.progress.OutgoingReviewProgressResponse;
import edu.hcmute.peergradehub.dto.response.progress.ProgressDashboardResponse;
import edu.hcmute.peergradehub.dto.response.progress.ProgressStatisticsResponse;
import edu.hcmute.peergradehub.dto.response.progress.ReceivedReviewEvidenceResponse;
import edu.hcmute.peergradehub.dto.response.progress.SubmissionProgressResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.PeerReview;
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ProgressMapper {

    public ProgressDashboardResponse toDashboardResponse(
            Course course,
            Assignment assignment,
            ProgressStatisticsResponse statistics,
            List<GroupProgressSummaryResponse> groups
    ) {
        return new ProgressDashboardResponse(
                toCourseSummary(course),
                toAssignmentSummary(assignment),
                statistics,
                List.copyOf(groups)
        );
    }

    public GroupMonitoringDetailResponse toGroupDetailResponse(
            StudentGroup group,
            AssignmentSubmission submission,
            List<PeerReviewAssignment> outgoingAssignments,
            List<PeerReview> receivedReviews,
            Map<Long, PeerReview> reviewsByAssignmentId
    ) {
        List<OutgoingReviewProgressResponse> outgoingReviews = outgoingAssignments.stream()
                .map(assignment -> toOutgoingReview(
                        assignment,
                        reviewsByAssignmentId.get(assignment.getId())
                ))
                .toList();
        List<ReceivedReviewEvidenceResponse> evidence = receivedReviews.stream()
                .map(this::toReceivedEvidence)
                .toList();

        return new GroupMonitoringDetailResponse(
                toGroup(group),
                toSubmission(submission),
                outgoingReviews,
                evidence
        );
    }

    private CourseProgressSummaryResponse toCourseSummary(Course course) {
        return new CourseProgressSummaryResponse(
                course.getId(),
                course.getCourseName(),
                course.getClassCode(),
                course.getGroupFormationDeadline(),
                course.getCourseStatus()
        );
    }

    private AssignmentProgressSummaryResponse toAssignmentSummary(Assignment assignment) {
        return new AssignmentProgressSummaryResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getSubmissionDeadline(),
                assignment.getReviewDeadline()
        );
    }

    private MonitoredGroupResponse toGroup(StudentGroup group) {
        return new MonitoredGroupResponse(
                group.getId(),
                group.getGroupName(),
                group.getGroupStatus()
        );
    }

    private SubmissionProgressResponse toSubmission(AssignmentSubmission submission) {
        if (submission == null) {
            return null;
        }
        return new SubmissionProgressResponse(
                submission.getId(),
                submission.getSubmissionStatus(),
                submission.getSubmittedAt(),
                submission.getSubmittedBy() == null ? null : submission.getSubmittedBy().getId(),
                submission.getNote()
        );
    }

    private OutgoingReviewProgressResponse toOutgoingReview(
            PeerReviewAssignment assignment,
            PeerReview review
    ) {
        StudentGroup targetGroup = assignment.getRevieweeGroup();
        return new OutgoingReviewProgressResponse(
                assignment.getId(),
                targetGroup.getId(),
                targetGroup.getGroupName(),
                assignment.getReviewAssignmentStatus(),
                review == null ? null : review.getReviewStatus(),
                assignment.getAssignedAt(),
                assignment.getDueAt(),
                review == null ? null : review.getSubmittedAt()
        );
    }

    private ReceivedReviewEvidenceResponse toReceivedEvidence(PeerReview review) {
        PeerReviewAssignment assignment = review.getPeerReviewAssignment();
        StudentGroup reviewerGroup = assignment.getReviewerGroup();
        return new ReceivedReviewEvidenceResponse(
                assignment.getId(),
                review.getId(),
                reviewerGroup.getId(),
                reviewerGroup.getGroupName(),
                review.getReviewStatus(),
                review.getScore(),
                review.getComment(),
                review.getSubmittedAt()
        );
    }
}
