package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseDao extends JpaRepository<Course, Long> {
    Optional<Course> findByClassCode(String classCode);
    boolean existsByClassCode(String classCode);
}
