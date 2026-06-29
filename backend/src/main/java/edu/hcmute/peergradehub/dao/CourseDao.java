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
     // ===== NEW FOR UC-10 STUDENT NAVIGATION =====
    
    /**
     * Get all ACTIVE courses that a student has joined.
     */
    @Query("SELECT c FROM Course c JOIN CourseEnrollment e ON c.id = e.course.id WHERE e.student.id = :studentId AND c.courseStatus = 'ACTIVE'")
    List<Course> findActiveCoursesByStudentId(@Param("studentId") Long studentId);
}
