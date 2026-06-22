package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.Assignment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentDao extends JpaRepository<Assignment, Long> {
    List<Assignment> findByLessonId(Long lessonId);

    @EntityGraph(attributePaths = {"lesson.course.lecturer"})
    @Query("select assignment from Assignment assignment where assignment.id = :assignmentId")
    Optional<Assignment> findByIdWithCourseAndLecturer(@Param("assignmentId") Long assignmentId);
}
