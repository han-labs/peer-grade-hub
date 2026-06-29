package edu.hcmute.peergradehub.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.enumeration.CourseStatus;

@Repository
public interface CourseDao extends JpaRepository<Course, Long> {
    Optional<Course> findByClassCode(String classCode);
    boolean existsByClassCode(String classCode);
    List<Course> findByLecturerId(Long lecturerId);
    Optional<Course> findByIdAndLecturerId(Long courseId, Long lecturerId);
    boolean existsByClassCodeAndIdNot(String classCode, Long courseId);
    boolean existsByInvitationCode(String invitationCode);
    List<Course> findByLecturerIdAndCourseStatus(Long lecturerId, CourseStatus status);
    long countByCourseStatus(CourseStatus status);
    long countByLecturerIdAndCourseStatus(Long lecturerId, CourseStatus status);
    List<Course> findTop5ByOrderByCreatedAtDesc();

    @Query("""
            select distinct groupMember.group.course
            from GroupMember groupMember
            where groupMember.user.id = :studentId
              and groupMember.group.course.courseStatus = :status
            order by groupMember.group.course.createdAt desc
            """)
    List<Course> findCoursesByStudentIdAndStatus(
            @Param("studentId") Long studentId,
            @Param("status") CourseStatus status
    );

    default List<Course> findActiveCoursesByStudentId(Long studentId) {
        return findCoursesByStudentIdAndStatus(studentId, CourseStatus.ACTIVE);
    }
}
