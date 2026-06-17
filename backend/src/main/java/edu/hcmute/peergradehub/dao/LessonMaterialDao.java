package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.LessonMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonMaterialDao extends JpaRepository<LessonMaterial, Long> {
    List<LessonMaterial> findByLessonId(Long lessonId);
    List<LessonMaterial> findByAssignmentId(Long assignmentId);
}
