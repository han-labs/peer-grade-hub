package edu.hcmute.peergradehub.progress.service;

import edu.hcmute.peergradehub.dto.response.progress.GroupProgressSummaryResponse;
import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import edu.hcmute.peergradehub.entity.PeerReview;
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.enumeration.GroupStatus;
import edu.hcmute.peergradehub.enumeration.ProgressFilter;
import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.ReviewStatus;
import edu.hcmute.peergradehub.enumeration.SubmissionStatus;
import edu.hcmute.peergradehub.service.support.ProgressStatisticsCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProgressStatisticsCalculatorTest {

    private final ProgressStatisticsCalculator calculator = new ProgressStatisticsCalculator();

    private StudentGroup group1;
    private StudentGroup group2;
    private StudentGroup group3;
    private AssignmentSubmission submitted;
    private AssignmentSubmission late;
    private PeerReviewAssignment completedTask;
    private PeerReviewAssignment incompleteTask;
    private PeerReviewAssignment cancelledTask;
    private PeerReview completedReview;
    private PeerReview draftReview;

    @BeforeEach
    void setUp() {
        group1 = group(1L, "Group 1");
        group2 = group(2L, "Group 2");
        group3 = group(3L, "Group 3");
        submitted = submission(11L, group1, SubmissionStatus.SUBMITTED);
        late = submission(12L, group2, SubmissionStatus.LATE);
        completedTask = reviewAssignment(
                21L,
                group1,
                group2,
                ReviewAssignmentStatus.SUBMITTED
        );
        incompleteTask = reviewAssignment(
                22L,
                group2,
                group1,
                ReviewAssignmentStatus.IN_PROGRESS
        );
        cancelledTask = reviewAssignment(
                23L,
                group1,
                group3,
                ReviewAssignmentStatus.CANCELLED
        );
        completedReview = review(31L, completedTask, ReviewStatus.SUBMITTED);
        draftReview = review(32L, incompleteTask, ReviewStatus.DRAFT);
    }

    @Test
    void calculate_UsesApprovedSubmissionAndReviewSemantics() {
        ProgressStatisticsCalculator.CalculationResult result = calculateFixture();

        assertEquals(3, result.statistics().totalGroups());
        assertEquals(2, result.statistics().submittedCount());
        assertEquals(1, result.statistics().pendingCount());
        assertEquals(1, result.statistics().lateCount());
        assertEquals(new BigDecimal("66.67"), result.statistics().submissionCompletionRate());
        assertEquals(2, result.statistics().totalReviewAssignments());
        assertEquals(1, result.statistics().completedReviews());
        assertEquals(1, result.statistics().incompleteReviews());
        assertEquals(new BigDecimal("50.00"), result.statistics().peerReviewCompletionRate());
        assertEquals(1, result.statistics().groupsWithNoReceivedReview());
        assertEquals(1, result.statistics().groupsWithIncompleteAssignedReviews());
    }

    @Test
    void calculate_ExcludesCancelledTasksFromGroupSummaries() {
        ProgressStatisticsCalculator.CalculationResult result = calculateFixture();

        GroupProgressSummaryResponse group1Summary = result.groups().get(0);
        GroupProgressSummaryResponse group2Summary = result.groups().get(1);
        GroupProgressSummaryResponse group3Summary = result.groups().get(2);

        assertEquals(1, group1Summary.assignedReviewCount());
        assertEquals(1, group1Summary.completedReviewCount());
        assertEquals(1, group2Summary.incompleteReviewCount());
        assertEquals(0, group3Summary.receivedReviewCount());
    }

    @Test
    void filter_CoversEveryApprovedFilter() {
        List<GroupProgressSummaryResponse> groups = calculateFixture().groups();

        assertGroupIds(groups, ProgressFilter.ALL, 1L, 2L, 3L);
        assertGroupIds(groups, ProgressFilter.INCOMPLETE, 2L, 3L);
        assertGroupIds(groups, ProgressFilter.NOT_SUBMITTED, 3L);
        assertGroupIds(groups, ProgressFilter.SUBMITTED, 1L, 2L);
        assertGroupIds(groups, ProgressFilter.LATE, 2L);
        assertGroupIds(groups, ProgressFilter.NOT_REVIEWED, 2L);
        assertGroupIds(groups, ProgressFilter.REVIEWED, 1L);
        assertGroupIds(groups, ProgressFilter.NO_RECEIVED_REVIEW, 3L);
    }

    @Test
    void calculate_ReturnedSubmissionAndReviewRemainIncomplete() {
        AssignmentSubmission returnedSubmission = submission(13L, group3, SubmissionStatus.RETURNED);
        PeerReview returnedReview = review(32L, incompleteTask, ReviewStatus.RETURNED);

        ProgressStatisticsCalculator.CalculationResult result = calculator.calculate(
                List.of(group1, group2, group3),
                List.of(submitted, late, returnedSubmission),
                List.of(completedTask, incompleteTask),
                List.of(completedReview, returnedReview)
        );

        assertEquals(1, result.statistics().pendingCount());
        assertEquals(1, result.statistics().incompleteReviews());
        assertGroupIds(result.groups(), ProgressFilter.NOT_SUBMITTED, 3L);
        assertGroupIds(result.groups(), ProgressFilter.NOT_REVIEWED, 2L);
    }

    @Test
    void calculate_UsesZeroRatesWhenThereAreNoGroupsOrReviewTasks() {
        ProgressStatisticsCalculator.CalculationResult result = calculator.calculate(
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );

        assertEquals(new BigDecimal("0.00"), result.statistics().submissionCompletionRate());
        assertEquals(new BigDecimal("0.00"), result.statistics().peerReviewCompletionRate());
    }

    private ProgressStatisticsCalculator.CalculationResult calculateFixture() {
        return calculator.calculate(
                List.of(group1, group2, group3),
                List.of(submitted, late),
                List.of(completedTask, incompleteTask, cancelledTask),
                List.of(completedReview, draftReview)
        );
    }

    private void assertGroupIds(
            List<GroupProgressSummaryResponse> groups,
            ProgressFilter filter,
            Long... expectedIds
    ) {
        assertEquals(
                List.of(expectedIds),
                calculator.filter(groups, filter).stream()
                        .map(GroupProgressSummaryResponse::groupId)
                        .toList()
        );
    }

    private StudentGroup group(Long id, String name) {
        return StudentGroup.builder()
                .id(id)
                .groupName(name)
                .groupStatus(GroupStatus.READY)
                .build();
    }

    private AssignmentSubmission submission(
            Long id,
            StudentGroup group,
            SubmissionStatus status
    ) {
        return AssignmentSubmission.builder()
                .id(id)
                .group(group)
                .submissionStatus(status)
                .submittedAt(LocalDateTime.now())
                .build();
    }

    private PeerReviewAssignment reviewAssignment(
            Long id,
            StudentGroup reviewer,
            StudentGroup target,
            ReviewAssignmentStatus status
    ) {
        return PeerReviewAssignment.builder()
                .id(id)
                .reviewerGroup(reviewer)
                .revieweeGroup(target)
                .reviewAssignmentStatus(status)
                .build();
    }

    private PeerReview review(
            Long id,
            PeerReviewAssignment assignment,
            ReviewStatus status
    ) {
        return PeerReview.builder()
                .id(id)
                .peerReviewAssignment(assignment)
                .reviewStatus(status)
                .build();
    }
}
