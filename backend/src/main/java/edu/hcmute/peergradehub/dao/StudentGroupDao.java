package edu.hcmute.peergradehub.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.enumeration.GroupStatus;

@Repository
public interface StudentGroupDao extends JpaRepository<StudentGroup, Long> {
    List<StudentGroup> findByCourseId(Long courseId);
    Optional<StudentGroup> findByIdAndCourseId(Long id, Long courseId);
    boolean existsByCourseIdAndGroupName(Long courseId, String groupName);
    List<StudentGroup> findByCourseIdOrderByIdAsc(Long courseId);
    boolean existsByCourseId(Long courseId);
    List<StudentGroup> findByCourseIdAndGroupStatus(Long courseId, GroupStatus groupStatus);

    @Query("SELECT g FROM StudentGroup g WHERE g.course.id = :courseId")
    List<StudentGroup> findByCourseIdWithMembers(@Param("courseId") Long courseId);
    
    @Query("SELECT g FROM StudentGroup g WHERE g.id = :id")
    Optional<StudentGroup> findByIdWithMembers(@Param("id") Long id);
}
