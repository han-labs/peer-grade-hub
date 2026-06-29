package edu.hcmute.peergradehub.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.hcmute.peergradehub.entity.PeerReviewAssignment;

@Repository
public interface PeerReviewAssignmentDao extends JpaRepository<PeerReviewAssignment, Long> {
    @EntityGraph(attributePaths = {"reviewerGroup", "revieweeGroup", "assignedBy"})
    List<PeerReviewAssignment> findByAssignmentId(Long assignmentId);
    @EntityGraph(attributePaths = {"assignment.lesson.course", "reviewerGroup", "revieweeGroup"})
    List<PeerReviewAssignment> findByAssignmentIdIn(List<Long> assignmentIds);
    List<PeerReviewAssignment> findByReviewerGroupId(Long reviewerGroupId);
    @EntityGraph(attributePaths = {"assignment.lesson.course", "reviewerGroup", "revieweeGroup"})
    List<PeerReviewAssignment> findByReviewerGroupIdIn(List<Long> reviewerGroupIds);
    List<PeerReviewAssignment> findByRevieweeGroupId(Long revieweeGroupId);
    boolean existsByReviewerGroupId(Long reviewerGroupId);
    boolean existsByRevieweeGroupId(Long revieweeGroupId);
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

    // ===== NEW FOR UC-09: Count peer reviews for a reviewee group =====
    
    /**
     * Count how many peer review assignments have been assigned to a specific group as reviewee
     * for a specific assignment.
     */
    @Query("SELECT COUNT(pra) FROM PeerReviewAssignment pra " +
           "WHERE pra.assignment.id = :assignmentId " +
           "AND pra.revieweeGroup.id = :revieweeGroupId")
    long countByAssignmentIdAndRevieweeGroupId(
            @Param("assignmentId") Long assignmentId,
            @Param("revieweeGroupId") Long revieweeGroupId
    );

    /**
     * Check if a reviewee group has at least one peer review assigned for a specific assignment.
     */
    @Query("SELECT CASE WHEN COUNT(pra) > 0 THEN true ELSE false END " +
           "FROM PeerReviewAssignment pra " +
           "WHERE pra.assignment.id = :assignmentId " +
           "AND pra.revieweeGroup.id = :revieweeGroupId")
    boolean existsByAssignmentIdAndRevieweeGroupId(
            @Param("assignmentId") Long assignmentId,
            @Param("revieweeGroupId") Long revieweeGroupId
    );
}
