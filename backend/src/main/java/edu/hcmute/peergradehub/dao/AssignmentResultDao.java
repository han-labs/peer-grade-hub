package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.AssignmentResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssignmentResultDao extends JpaRepository<AssignmentResult, Long> {
    Optional<AssignmentResult> findByAssignmentIdAndGroupId(Long assignmentId, Long groupId);
    boolean existsByAssignmentIdAndGroupId(Long assignmentId, Long groupId);
}
