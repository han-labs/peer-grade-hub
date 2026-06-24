package edu.hcmute.peergradehub.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.hcmute.peergradehub.entity.StudentGroup;

@Repository
public interface StudentGroupDao extends JpaRepository<StudentGroup, Long> {
    List<StudentGroup> findByCourseId(Long courseId);
    Optional<StudentGroup> findByIdAndCourseId(Long id, Long courseId);
    boolean existsByCourseIdAndGroupName(Long courseId, String groupName);

    @Query("SELECT g FROM StudentGroup g WHERE g.course.id = :courseId")
    List<StudentGroup> findByCourseIdWithMembers(@Param("courseId") Long courseId);
    
    @Query("SELECT g FROM StudentGroup g WHERE g.id = :id")
    Optional<StudentGroup> findByIdWithMembers(@Param("id") Long id);
}
