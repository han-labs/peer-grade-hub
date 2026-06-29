package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.PeerReview;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PeerReviewDao extends JpaRepository<PeerReview, Long> {
    Optional<PeerReview> findByPeerReviewAssignmentId(Long peerReviewAssignmentId);
    boolean existsByPeerReviewAssignmentId(Long peerReviewAssignmentId);
    List<PeerReview> findByPeerReviewAssignmentIdIn(List<Long> peerReviewAssignmentIds);

    @EntityGraph(attributePaths = {
        "peerReviewAssignment.reviewerGroup",
        "peerReviewAssignment.revieweeGroup",
        "submittedBy"
    })
    @Query("select review from PeerReview review "
            + "where review.peerReviewAssignment.assignment.id = :assignmentId")
    List<PeerReview> findByAssignmentId(@Param("assignmentId") Long assignmentId);

    // ===== NEW METHODS FOR UC-10 =====

    /**
     * Get all peer reviews received by a specific group for an assignment.
     * Used for UC-10 to display peer feedback for a group.
     */
    @EntityGraph(attributePaths = {
        "peerReviewAssignment.reviewerGroup",
        "peerReviewAssignment.revieweeGroup",
        "submittedBy"
    })
    @Query("SELECT review FROM PeerReview review " +
           "WHERE review.peerReviewAssignment.assignment.id = :assignmentId " +
           "AND review.peerReviewAssignment.revieweeGroup.id = :revieweeGroupId")
    List<PeerReview> findByAssignmentIdAndRevieweeGroupId(
            @Param("assignmentId") Long assignmentId,
            @Param("revieweeGroupId") Long revieweeGroupId
    );

    /**
     * Get all peer reviews for an assignment with reviewer group anonymous
     * (reviewer group name is hidden from students, but visible to lecturers).
     * For Showcase Gallery (BR-15: anonymous feedback only).
     */
    @EntityGraph(attributePaths = {
        "peerReviewAssignment.reviewerGroup",
        "peerReviewAssignment.revieweeGroup",
        "submittedBy"
    })
    @Query("SELECT review FROM PeerReview review " +
           "WHERE review.peerReviewAssignment.assignment.id = :assignmentId")
    List<PeerReview> findByAssignmentIdWithReviewerInfo(
            @Param("assignmentId") Long assignmentId
    );
}
