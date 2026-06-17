package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.ResultAppeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResultAppealDao extends JpaRepository<ResultAppeal, Long> {
    Optional<ResultAppeal> findByAssignmentResultId(Long assignmentResultId);
    boolean existsByAssignmentResultId(Long assignmentResultId);
}
