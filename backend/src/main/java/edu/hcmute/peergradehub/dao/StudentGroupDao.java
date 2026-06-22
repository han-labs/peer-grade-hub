package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.StudentGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentGroupDao extends JpaRepository<StudentGroup, Long> {
    List<StudentGroup> findByCourseId(Long courseId);
    Optional<StudentGroup> findByIdAndCourseId(Long id, Long courseId);
    boolean existsByCourseIdAndGroupName(Long courseId, String groupName);
}
