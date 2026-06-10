package edu.hcmute.peergradehub.material.repository;

import edu.hcmute.peergradehub.material.model.LessonMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonMaterialRepository extends JpaRepository<LessonMaterial, Long> {
    List<LessonMaterial> findByLessonId(Long lessonId);
    List<LessonMaterial> findByAssignmentId(Long assignmentId);
}
