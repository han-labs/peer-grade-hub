package edu.hcmute.peergradehub.appeal.repository;

import edu.hcmute.peergradehub.appeal.model.ResultAppeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResultAppealRepository extends JpaRepository<ResultAppeal, Long> {
    Optional<ResultAppeal> findByAssignmentResultId(Long assignmentResultId);
    boolean existsByAssignmentResultId(Long assignmentResultId);
}
