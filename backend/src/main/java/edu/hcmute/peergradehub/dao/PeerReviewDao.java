package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.PeerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PeerReviewDao extends JpaRepository<PeerReview, Long> {
    Optional<PeerReview> findByPeerReviewAssignmentId(Long peerReviewAssignmentId);
    boolean existsByPeerReviewAssignmentId(Long peerReviewAssignmentId);
}
