package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentDao extends JpaRepository<Assignment, Long> {
    List<Assignment> findByLessonId(Long lessonId);
}
