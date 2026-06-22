package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PeerReviewAssignmentDao extends JpaRepository<PeerReviewAssignment, Long> {
    @EntityGraph(attributePaths = {"reviewerGroup", "revieweeGroup", "assignedBy"})
    List<PeerReviewAssignment> findByAssignmentId(Long assignmentId);
    List<PeerReviewAssignment> findByReviewerGroupId(Long reviewerGroupId);
    List<PeerReviewAssignment> findByRevieweeGroupId(Long revieweeGroupId);
    Optional<PeerReviewAssignment> findByAssignmentIdAndReviewerGroupIdAndRevieweeGroupId(
            Long assignmentId,
            Long reviewerGroupId,
            Long revieweeGroupId
    );

    @EntityGraph(attributePaths = {"assignment.lesson.course.lecturer", "reviewerGroup", "revieweeGroup"})
    @Query("select peerReviewAssignment from PeerReviewAssignment peerReviewAssignment "
            + "where peerReviewAssignment.id = :peerReviewAssignmentId")
    Optional<PeerReviewAssignment> findByIdWithAssignmentCourseAndLecturer(
            @Param("peerReviewAssignmentId") Long peerReviewAssignmentId
    );
}
