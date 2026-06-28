package edu.hcmute.peergradehub.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.hcmute.peergradehub.entity.AssignmentSubmission;

@Repository
public interface AssignmentSubmissionDao extends JpaRepository<AssignmentSubmission, Long> {
    @EntityGraph(attributePaths = {"group", "submittedBy"})
    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);
    List<AssignmentSubmission> findByGroupId(Long groupId);
    Optional<AssignmentSubmission> findByAssignmentIdAndGroupId(Long assignmentId, Long groupId);
    boolean existsByAssignmentIdAndGroupId(Long assignmentId, Long groupId);
    boolean existsByGroupId(Long groupId);

    // ===== NEW FOR UC-09: KHÔNG dùng @EntityGraph với attachments =====
    // Vì AssignmentSubmission KHÔNG có field attachments
    
    @Query("SELECT s FROM AssignmentSubmission s " +
           "JOIN FETCH s.group g " +
           "JOIN FETCH s.submittedBy u " +
           "WHERE s.assignment.id = :assignmentId AND s.group.id = :groupId")
    Optional<AssignmentSubmission> findByAssignmentIdAndGroupIdWithAttachments(
            @Param("assignmentId") Long assignmentId,
            @Param("groupId") Long groupId
    );

    @Query("SELECT s FROM AssignmentSubmission s " +
           "JOIN FETCH s.group g " +
           "JOIN FETCH s.submittedBy u " +
           "WHERE s.assignment.id = :assignmentId")
    List<AssignmentSubmission> findByAssignmentIdWithGroupAndSubmitter(
            @Param("assignmentId") Long assignmentId
    );
}
