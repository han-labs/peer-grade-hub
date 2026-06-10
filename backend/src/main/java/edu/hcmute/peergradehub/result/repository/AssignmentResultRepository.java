package edu.hcmute.peergradehub.result.repository;

import edu.hcmute.peergradehub.result.model.AssignmentResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssignmentResultRepository extends JpaRepository<AssignmentResult, Long> {
    Optional<AssignmentResult> findByAssignmentIdAndGroupId(Long assignmentId, Long groupId);
    boolean existsByAssignmentIdAndGroupId(Long assignmentId, Long groupId);
}
