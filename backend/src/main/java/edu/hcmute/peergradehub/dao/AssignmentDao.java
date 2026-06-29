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

import edu.hcmute.peergradehub.entity.Assignment;

@Repository
public interface AssignmentDao extends JpaRepository<Assignment, Long> {
    List<Assignment> findByLessonId(Long lessonId);
    boolean existsByLessonId(Long lessonId);

    @Query("select assignment from Assignment assignment "
            + "join fetch assignment.lesson lesson "
            + "join fetch lesson.course course "
            + "where course.id in :courseIds")
    List<Assignment> findByCourseIdIn(@Param("courseIds") List<Long> courseIds);

    @Query("select count(assignment) from Assignment assignment "
            + "where assignment.lesson.course.id in :courseIds")
    long countByCourseIdIn(@Param("courseIds") List<Long> courseIds);

    @EntityGraph(attributePaths = {"lesson.course.lecturer"})
    @Query("select assignment from Assignment assignment where assignment.id = :assignmentId")
    Optional<Assignment> findByIdWithCourseAndLecturer(@Param("assignmentId") Long assignmentId);

    // ===== NEW FOR UC-09: Update Showcase Mode =====
    
    @Modifying
    @Transactional
    @Query("UPDATE Assignment a SET a.showcaseMode = :enabled WHERE a.id = :assignmentId")
    int updateShowcaseMode(@Param("assignmentId") Long assignmentId, @Param("enabled") Boolean enabled);
}
