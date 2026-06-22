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

    @EntityGraph(attributePaths = {
        "peerReviewAssignment.reviewerGroup",
        "peerReviewAssignment.revieweeGroup",
        "submittedBy"
    })
    @Query("select review from PeerReview review "
            + "where review.peerReviewAssignment.assignment.id = :assignmentId")
    List<PeerReview> findByAssignmentId(@Param("assignmentId") Long assignmentId);
}
