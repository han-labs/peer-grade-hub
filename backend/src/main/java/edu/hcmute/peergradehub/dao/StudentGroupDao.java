package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.StudentGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentGroupDao extends JpaRepository<StudentGroup, Long> {
    List<StudentGroup> findByCourseId(Long courseId);
    boolean existsByCourseIdAndGroupName(Long courseId, String groupName);
}
