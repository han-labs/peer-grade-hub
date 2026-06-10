package edu.hcmute.peergradehub.course.repository;

import edu.hcmute.peergradehub.course.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByClassCode(String classCode);
    boolean existsByClassCode(String classCode);
}
