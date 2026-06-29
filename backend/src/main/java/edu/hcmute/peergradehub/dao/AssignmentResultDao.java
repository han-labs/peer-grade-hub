package edu.hcmute.peergradehub.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import edu.hcmute.peergradehub.entity.AssignmentResult;

@Repository
public interface AssignmentResultDao extends JpaRepository<AssignmentResult, Long> {
    Optional<AssignmentResult> findByAssignmentIdAndGroupId(Long assignmentId, Long groupId);
    boolean existsByAssignmentIdAndGroupId(Long assignmentId, Long groupId);
    boolean existsByGroupId(Long groupId);
    long countByPublished(Boolean published);
    long countByGroupIdInAndPublished(List<Long> groupIds, Boolean published);

     // ===== NEW FOR UC-09 =====

    /**
     * Find assignment result by assignment and group with publishedBy loaded.
     */
    @EntityGraph(attributePaths = {"publishedBy", "gradedBy"})
    @Query("SELECT r FROM AssignmentResult r " +
           "WHERE r.assignment.id = :assignmentId AND r.group.id = :groupId")
    Optional<AssignmentResult> findByAssignmentIdAndGroupIdWithPublishers(
            @Param("assignmentId") Long assignmentId,
            @Param("groupId") Long groupId
    );

    /**
     * Get all assignment results for an assignment with group and publishedBy loaded.
     * Useful for grading page.
     */
    @EntityGraph(attributePaths = {"group", "publishedBy", "gradedBy"})
    @Query("SELECT r FROM AssignmentResult r " +
           "WHERE r.assignment.id = :assignmentId")
    List<AssignmentResult> findByAssignmentIdWithGroupAndPublishers(
            @Param("assignmentId") Long assignmentId
    );

    /**
     * Check if a group already has a published grade for an assignment.
     */
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END " +
           "FROM AssignmentResult r " +
           "WHERE r.assignment.id = :assignmentId " +
           "AND r.group.id = :groupId " +
           "AND r.published = true")
    boolean existsPublishedByAssignmentIdAndGroupId(
            @Param("assignmentId") Long assignmentId,
            @Param("groupId") Long groupId
    );

    /**
     * Get all published results for an assignment.
     */
    @Query("SELECT r FROM AssignmentResult r " +
           "WHERE r.assignment.id = :assignmentId AND r.published = true")
    List<AssignmentResult> findPublishedByAssignmentId(@Param("assignmentId") Long assignmentId);

    /**
     * Update grade and publish status for a specific assignment result.
     */
    @Modifying
    @Transactional
    @Query("UPDATE AssignmentResult r " +
           "SET r.score = :score, " +
           "    r.finalComment = :comment, " +
           "    r.published = true, " +
           "    r.publishedAt = CURRENT_TIMESTAMP, " +
           "    r.publishedBy.id = :publishedById " +
           "WHERE r.assignment.id = :assignmentId AND r.group.id = :groupId")
    int updateAndPublish(
            @Param("assignmentId") Long assignmentId,
            @Param("groupId") Long groupId,
            @Param("score") java.math.BigDecimal score,
            @Param("comment") String comment,
            @Param("publishedById") Long publishedById
    );
}
