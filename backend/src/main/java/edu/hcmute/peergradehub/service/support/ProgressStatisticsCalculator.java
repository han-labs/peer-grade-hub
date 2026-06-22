package edu.hcmute.peergradehub.service.support;

import edu.hcmute.peergradehub.dto.response.progress.GroupProgressSummaryResponse;
import edu.hcmute.peergradehub.dto.response.progress.ProgressStatisticsResponse;
import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import edu.hcmute.peergradehub.entity.PeerReview;
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.enumeration.ProgressFilter;
import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.ReviewStatus;
import edu.hcmute.peergradehub.enumeration.SubmissionStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class ProgressStatisticsCalculator {

    private static final int RATE_SCALE = 2;

    public CalculationResult calculate(
            List<StudentGroup> groups,
            List<AssignmentSubmission> submissions,
            List<PeerReviewAssignment> reviewAssignments,
            List<PeerReview> reviews
    ) {
        Map<Long, AssignmentSubmission> submissionsByGroupId = submissions.stream()
                .collect(Collectors.toMap(
                        submission -> submission.getGroup().getId(),
                        Function.identity()
                ));
        Map<Long, PeerReview> reviewsByAssignmentId = reviews.stream()
                .collect(Collectors.toMap(
                        review -> review.getPeerReviewAssignment().getId(),
                        Function.identity()
                ));
        List<PeerReviewAssignment> activeReviewAssignments = reviewAssignments.stream()
                .filter(this::isActive)
                .toList();

        List<GroupProgressSummaryResponse> groupSummaries = groups.stream()
                .map(group -> summarizeGroup(
                        group,
                        submissionsByGroupId.get(group.getId()),
                        activeReviewAssignments,
                        reviewsByAssignmentId
                ))
                .sorted(Comparator.comparing(
                        GroupProgressSummaryResponse::groupName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                ).thenComparing(
                        GroupProgressSummaryResponse::groupId,
                        Comparator.nullsLast(Long::compareTo)
                ))
                .toList();

        long submittedCount = groupSummaries.stream().filter(this::isSubmitted).count();
        long lateCount = groupSummaries.stream().filter(GroupProgressSummaryResponse::late).count();
        long completedReviews = activeReviewAssignments.stream()
                .filter(assignment -> isCompleted(reviewsByAssignmentId.get(assignment.getId())))
                .count();
        long totalGroups = groupSummaries.size();
        long totalReviewAssignments = activeReviewAssignments.size();

        ProgressStatisticsResponse statistics = new ProgressStatisticsResponse(
                totalGroups,
                submittedCount,
                totalGroups - submittedCount,
                lateCount,
                percentage(submittedCount, totalGroups),
                totalReviewAssignments,
                completedReviews,
                totalReviewAssignments - completedReviews,
                percentage(completedReviews, totalReviewAssignments),
                groupSummaries.stream().filter(group -> !group.hasReceivedReview()).count(),
                groupSummaries.stream().filter(group -> group.incompleteReviewCount() > 0).count()
        );

        return new CalculationResult(statistics, groupSummaries);
    }

    public List<GroupProgressSummaryResponse> filter(
            List<GroupProgressSummaryResponse> groups,
            ProgressFilter filter
    ) {
        ProgressFilter effectiveFilter = filter == null ? ProgressFilter.ALL : filter;
        return groups.stream()
                .filter(group -> matches(group, effectiveFilter))
                .toList();
    }

    private GroupProgressSummaryResponse summarizeGroup(
            StudentGroup group,
            AssignmentSubmission submission,
            List<PeerReviewAssignment> activeReviewAssignments,
            Map<Long, PeerReview> reviewsByAssignmentId
    ) {
        List<PeerReviewAssignment> outgoing = activeReviewAssignments.stream()
                .filter(assignment -> group.getId().equals(assignment.getReviewerGroup().getId()))
                .toList();
        long completedOutgoing = outgoing.stream()
                .filter(assignment -> isCompleted(reviewsByAssignmentId.get(assignment.getId())))
                .count();
        long receivedCount = activeReviewAssignments.stream()
                .filter(assignment -> group.getId().equals(assignment.getRevieweeGroup().getId()))
                .count();
        SubmissionStatus submissionStatus = submission == null
                ? null
                : submission.getSubmissionStatus();

        return new GroupProgressSummaryResponse(
                group.getId(),
                group.getGroupName(),
                group.getGroupStatus(),
                submissionStatus,
                submission == null ? null : submission.getSubmittedAt(),
                submissionStatus == SubmissionStatus.LATE,
                outgoing.size(),
                completedOutgoing,
                outgoing.size() - completedOutgoing,
                receivedCount,
                receivedCount > 0
        );
    }

    private boolean matches(GroupProgressSummaryResponse group, ProgressFilter filter) {
        return switch (filter) {
            case ALL -> true;
            case INCOMPLETE -> isNotSubmitted(group) || group.incompleteReviewCount() > 0;
            case NOT_SUBMITTED -> isNotSubmitted(group);
            case SUBMITTED -> isSubmitted(group);
            case LATE -> group.late();
            case NOT_REVIEWED -> group.incompleteReviewCount() > 0;
            case REVIEWED -> group.assignedReviewCount() > 0 && group.incompleteReviewCount() == 0;
            case NO_RECEIVED_REVIEW -> !group.hasReceivedReview();
        };
    }

    private boolean isSubmitted(GroupProgressSummaryResponse group) {
        return group.submissionStatus() == SubmissionStatus.SUBMITTED
                || group.submissionStatus() == SubmissionStatus.LATE;
    }

    private boolean isNotSubmitted(GroupProgressSummaryResponse group) {
        return !isSubmitted(group);
    }

    private boolean isActive(PeerReviewAssignment assignment) {
        return assignment.getReviewAssignmentStatus() != ReviewAssignmentStatus.CANCELLED;
    }

    private boolean isCompleted(PeerReview review) {
        return review != null && review.getReviewStatus() == ReviewStatus.SUBMITTED;
    }

    private BigDecimal percentage(long numerator, long denominator) {
        if (denominator == 0) {
            return BigDecimal.ZERO.setScale(RATE_SCALE, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(numerator)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(denominator), RATE_SCALE, RoundingMode.HALF_UP);
    }

    public record CalculationResult(
            ProgressStatisticsResponse statistics,
            List<GroupProgressSummaryResponse> groups
    ) {
        public CalculationResult {
            groups = List.copyOf(groups);
        }
    }
}
