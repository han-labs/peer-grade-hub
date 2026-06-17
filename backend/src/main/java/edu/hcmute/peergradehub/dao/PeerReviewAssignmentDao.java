package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PeerReviewAssignmentDao extends JpaRepository<PeerReviewAssignment, Long> {
    List<PeerReviewAssignment> findByAssignmentId(Long assignmentId);
    List<PeerReviewAssignment> findByReviewerGroupId(Long reviewerGroupId);
    List<PeerReviewAssignment> findByRevieweeGroupId(Long revieweeGroupId);
    Optional<PeerReviewAssignment> findByAssignmentIdAndReviewerGroupIdAndRevieweeGroupId(
            Long assignmentId,
            Long reviewerGroupId,
            Long revieweeGroupId
    );
}
