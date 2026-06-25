package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.dao.LessonDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.request.course.CreateLessonRequest;
import edu.hcmute.peergradehub.dto.response.course.LessonResponse;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.CourseStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.mapper.CourseMapper;
import edu.hcmute.peergradehub.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import edu.hcmute.peergradehub.entity.Assignment; 
import edu.hcmute.peergradehub.mapper.LessonMapper;
import java.util.List;
import java.util.Collections;
import edu.hcmute.peergradehub.dto.response.lesson.LessonAssignmentsResponse;
import edu.hcmute.peergradehub.dao.AssignmentDao;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonServiceImpl implements LessonService {

    private final LessonDao lessonRepository;
    private final UserDao userDao;
    private final CourseDao courseDao;
    private final CourseMapper courseMapper;
    private final AssignmentDao assignmentDao; 
    private final LessonMapper lessonMapper;
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

}
