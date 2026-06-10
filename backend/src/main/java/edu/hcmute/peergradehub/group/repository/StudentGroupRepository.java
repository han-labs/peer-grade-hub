package edu.hcmute.peergradehub.group.repository;

import edu.hcmute.peergradehub.group.model.StudentGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentGroupRepository extends JpaRepository<StudentGroup, Long> {
    List<StudentGroup> findByCourseId(Long courseId);
    boolean existsByCourseIdAndGroupName(Long courseId, String groupName);
}
