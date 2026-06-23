package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonDao extends JpaRepository<Lesson, Long> {
    List<Lesson> findByCourseId(Long courseId);
    Optional<Lesson> findByIdAndCourseId(Long lessonId, Long courseId);
}
