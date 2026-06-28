package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.dao.LessonDao;
import edu.hcmute.peergradehub.dao.LessonMaterialDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.request.course.CreateCourseRequest;
import edu.hcmute.peergradehub.dto.request.course.UpdateCourseRequest;
import edu.hcmute.peergradehub.dto.response.course.CourseSummaryResponse;
import edu.hcmute.peergradehub.dto.response.course.CourseWorkspaceResponse;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.entity.LessonMaterial;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.CourseStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ConflictException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.mapper.CourseMapper;
import edu.hcmute.peergradehub.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseServiceImpl implements CourseService {

    private final CourseDao courseRepository;
    private final UserDao userDao;
    private final LessonDao lessonDao;
    private final LessonMaterialDao lessonMaterialDao;
    private final CourseMapper courseMapper;

    @Override
    public List<CourseSummaryResponse> getActiveCourses(Long actorId) {
        validateLecturer(actorId);
        List<Course> courses = courseRepository.findByLecturerIdAndCourseStatus(actorId, CourseStatus.ACTIVE);
        return courses.stream()
                .map(courseMapper::toCourseSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Course createCourse(String courseName, String classCode, String semester, User lecturer, String description) {
        if (lecturer.getUserRole() != UserRole.LECTURER) {
            throw new IllegalArgumentException("Only lecturer can create course.");
        }
        if (courseRepository.existsByClassCode(classCode)) {
            throw new IllegalArgumentException("Class code must be unique.");
        }
        Course course = Course.builder()
                .courseName(courseName)
                .classCode(classCode)
                .semester(semester)
                .lecturer(lecturer)
                .description(description)
                .build();
        return courseRepository.save(course);
    }

    private User validateLecturer(Long actorId) {
        User user = userDao.findById(actorId)
                .orElseThrow(() -> new NotFoundException("Actor not found."));
        if (user.getUserRole() != UserRole.LECTURER || user.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("You are not authorized to perform this action.");
        }
        return user;
    }

    private String generateUniqueInvitationCode() {
        String code;
        do {
            code = "PGH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (courseRepository.existsByInvitationCode(code));
        return code;
    }

    private void validateRequiredFields(String courseName, String classCode, String semester) {
        if (!StringUtils.hasText(courseName) || !StringUtils.hasText(classCode) || !StringUtils.hasText(semester)) {
            throw new BadRequestException("Course Name, Class Code, and Semester are required. Please do not leave them empty.");
        }
    }

    @Override
    public List<CourseSummaryResponse> getLecturerCourses(Long actorId) {
        validateLecturer(actorId);
        List<Course> courses = courseRepository.findByLecturerId(actorId);
        return courses.stream()
                .map(courseMapper::toCourseSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CourseWorkspaceResponse createCourse(CreateCourseRequest request, Long actorId) {
        User lecturer = validateLecturer(actorId);
        validateRequiredFields(request.courseName(), request.classCode(), request.semester());

        if (courseRepository.existsByClassCode(request.classCode())) {
            throw new ConflictException("Class Code already exists. Please enter a different Class Code.");
        }

        String invitationCode = generateUniqueInvitationCode();

        Course course = Course.builder()
                .courseName(request.courseName())
                .classCode(request.classCode())
                .semester(request.semester())
                .description(request.description())
                .lecturer(lecturer)
                .invitationCode(invitationCode)
                .courseStatus(CourseStatus.ACTIVE)
                .build();

        Course savedCourse = courseRepository.save(course);
        return courseMapper.toWorkspace(savedCourse, Collections.emptyList(), Collections.emptyMap());
    }

    @Override
    public CourseWorkspaceResponse getCourseWorkspace(Long courseId, Long actorId) {
        validateLecturer(actorId);
        Course course = courseRepository.findByIdAndLecturerId(courseId, actorId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to manage this course."));

        List<Lesson> lessons = lessonDao.findByCourseId(courseId);
        Map<Long, List<LessonMaterial>> materialsByLessonId = lessons.stream()
                .collect(Collectors.toMap(
                        Lesson::getId,
                        lesson -> lessonMaterialDao.findByLessonId(lesson.getId())
                ));

        return courseMapper.toWorkspace(course, lessons, materialsByLessonId);
    }

    @Override
    @Transactional
    public CourseWorkspaceResponse updateCourse(Long courseId, UpdateCourseRequest request, Long actorId) {
        validateLecturer(actorId);
        validateRequiredFields(request.courseName(), request.classCode(), request.semester());

        Course course = courseRepository.findByIdAndLecturerId(courseId, actorId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to manage this course."));

        if (course.getCourseStatus() != CourseStatus.ACTIVE) {
            throw new BadRequestException("This course is archived and cannot be modified.");
        }

        if (!course.getClassCode().equals(request.classCode()) && 
            courseRepository.existsByClassCodeAndIdNot(request.classCode(), courseId)) {
            throw new ConflictException("Class Code already exists. Please enter a different Class Code.");
        }

        course.setCourseName(request.courseName());
        course.setClassCode(request.classCode());
        course.setSemester(request.semester());
        course.setDescription(request.description());

        Course savedCourse = courseRepository.save(course);

        List<Lesson> lessons = lessonDao.findByCourseId(courseId);
        Map<Long, List<LessonMaterial>> materialsByLessonId = lessons.stream()
                .collect(Collectors.toMap(
                        Lesson::getId,
                        lesson -> lessonMaterialDao.findByLessonId(lesson.getId())
                ));

        return courseMapper.toWorkspace(savedCourse, lessons, materialsByLessonId);
    }

}
