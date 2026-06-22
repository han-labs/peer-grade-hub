package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentSubmissionDao extends JpaRepository<AssignmentSubmission, Long> {
    @EntityGraph(attributePaths = {"group", "submittedBy"})
    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);
    List<AssignmentSubmission> findByGroupId(Long groupId);
    Optional<AssignmentSubmission> findByAssignmentIdAndGroupId(Long assignmentId, Long groupId);
    boolean existsByAssignmentIdAndGroupId(Long assignmentId, Long groupId);
}
