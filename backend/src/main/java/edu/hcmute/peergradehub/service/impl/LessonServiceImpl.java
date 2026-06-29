package edu.hcmute.peergradehub.service.impl;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.dao.CourseEnrollmentDao;
import edu.hcmute.peergradehub.dao.LessonDao;
import edu.hcmute.peergradehub.dao.LessonMaterialDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.request.course.CreateLessonRequest;
import edu.hcmute.peergradehub.dto.response.course.LessonResponse;
import edu.hcmute.peergradehub.dto.response.lesson.LessonAssignmentsResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.entity.LessonMaterial;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.CourseStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.mapper.CourseMapper;
import edu.hcmute.peergradehub.mapper.LessonMapper;
import edu.hcmute.peergradehub.service.LessonService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonServiceImpl implements LessonService {

    private final LessonDao lessonRepository;
    private final UserDao userDao;
    private final CourseDao courseDao;
    private final CourseMapper courseMapper;
    private final AssignmentDao assignmentDao; 
    private final LessonMaterialDao lessonMaterialDao;
    private final LessonMapper lessonMapper;
    private final CourseEnrollmentDao courseEnrollmentDao;

    @Override
    @Transactional
    public Lesson createLesson(String title, Course course) {
        Lesson lesson = Lesson.builder()
                .title(title)
                .course(course)
                .build();
        return lessonRepository.save(lesson);
    }

    @Override
    @Transactional
    public LessonResponse createLesson(Long courseId, CreateLessonRequest request, Long actorId) {
        User actor = userDao.findById(actorId)
                .orElseThrow(() -> new NotFoundException("Actor not found."));

        if (actor.getUserRole() != UserRole.LECTURER || actor.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("You are not authorized to perform this action.");
        }

        Course course = courseDao.findByIdAndLecturerId(courseId, actorId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to manage this course."));

        if (course.getCourseStatus() != CourseStatus.ACTIVE) {
            throw new BadRequestException("This course is archived and cannot be modified.");
        }

        if (!StringUtils.hasText(request.title())) {
            throw new BadRequestException("Lesson title is required.");
        }

        Lesson lesson = Lesson.builder()
                .title(request.title())
                .course(course)
                .build();

        Lesson savedLesson = lessonRepository.save(lesson);

        return courseMapper.toLessonResponse(savedLesson, Collections.emptyList());
    }

    @Override
    @Transactional
    public LessonResponse updateLesson(Long courseId, Long lessonId, CreateLessonRequest request, Long actorId) {
        User actor = userDao.findById(actorId)
                .orElseThrow(() -> new NotFoundException("Actor not found."));

        if (actor.getUserRole() != UserRole.LECTURER || actor.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("You are not authorized to perform this action.");
        }

        Course course = courseDao.findByIdAndLecturerId(courseId, actorId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to manage this course."));

        if (course.getCourseStatus() != CourseStatus.ACTIVE) {
            throw new BadRequestException("This course is archived and cannot be modified.");
        }

        if (!StringUtils.hasText(request.title())) {
            throw new BadRequestException("Lesson title is required.");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found."));

        if (lesson.getCourse() == null || !lesson.getCourse().getId().equals(courseId)) {
            throw new ForbiddenException("You are not authorized to update this lesson.");
        }

        lesson.setTitle(request.title());
        Lesson savedLesson = lessonRepository.save(lesson);

        List<LessonMaterial> materials = lessonMaterialDao.findByLessonId(lessonId);

        return courseMapper.toLessonResponse(savedLesson, materials != null ? materials : Collections.emptyList());
    }

    @Override
    @Transactional(readOnly = true)
    public LessonAssignmentsResponse getLessonAssignments(Long lessonId, Long actorId) {
        // 1. Lấy lesson
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));

        // 2. Lấy course từ lesson
        Course course = lesson.getCourse();
        if (course == null) {
            throw new NotFoundException("Course not found for this lesson");
        }

        // 3. Kiểm tra lecturer có quyền với course này không
        if (!course.getLecturer().getId().equals(actorId)) {
            throw new ForbiddenException("You are not authorized to view this lesson");
        }

        // 4. Lấy assignments của lesson
        List<Assignment> assignments = assignmentDao.findByLessonId(lessonId);

        // 5. Map sang response
        return lessonMapper.toLessonAssignmentsResponse(lesson, course, assignments);
    }

    // ===== UC-10: STUDENT NAVIGATION =====
    @Override
    public List<LessonResponse> getStudentLessons(Long courseId, Long studentId) {
        // 1. Kiểm tra student tồn tại
        User student = userDao.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Student not found."));
        
        if (student.getUserRole() != UserRole.STUDENT || student.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("Only active students can view lessons.");
        }
        
        // 2. Kiểm tra student đã join course này chưa
        boolean isEnrolled = courseEnrollmentDao.existsByCourseIdAndStudentId(courseId, studentId);
        if (!isEnrolled) {
            throw new ForbiddenException("You are not enrolled in this course.");
        }
        
        // 3. Kiểm tra course tồn tại và ACTIVE
        Course course = courseDao.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found."));
        
        if (course.getCourseStatus() != CourseStatus.ACTIVE) {
            throw new BadRequestException("This course is not active.");
        }
        
        // 4. Lấy lessons của course
        List<Lesson> lessons = lessonRepository.findByCourseId(courseId);
        
        // 5. Map sang response (không có materials cho student view)
        return lessons.stream()
                .map(lesson -> new LessonResponse(
                        lesson.getId(),
                        lesson.getTitle(),
                        Collections.emptyList()
                ))
                .collect(Collectors.toList());
    }

    // ===== DELETE LESSON =====
    @Override
    @Transactional
    public void deleteLesson(Long courseId, Long lessonId, Long actorId) {
        User actor = userDao.findById(actorId)
                .orElseThrow(() -> new NotFoundException("Actor not found."));

        if (actor.getUserRole() != UserRole.LECTURER || actor.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("You are not authorized to perform this action.");
        }

        Course course = courseDao.findByIdAndLecturerId(courseId, actorId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to manage this course."));

        if (course.getCourseStatus() != CourseStatus.ACTIVE) {
            throw new BadRequestException("This course is archived and cannot be modified.");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found."));

        if (lesson.getCourse() == null || !lesson.getCourse().getId().equals(courseId)) {
            throw new ForbiddenException("You are not authorized to delete this lesson.");
        }

        if (assignmentDao.existsByLessonId(lessonId)) {
            throw new BadRequestException("This lesson cannot be deleted because it has related assignments or assessment data.");
        }

        List<LessonMaterial> materials = lessonMaterialDao.findByLessonId(lessonId);
        if (materials != null && !materials.isEmpty()) {
            lessonMaterialDao.deleteAll(materials);
        }

        lessonRepository.delete(lesson);
    }
}