package edu.hcmute.peergradehub.course.service;

import edu.hcmute.peergradehub.course.model.Course;
import edu.hcmute.peergradehub.course.repository.CourseRepository;
import edu.hcmute.peergradehub.user.model.User;
import edu.hcmute.peergradehub.user.model.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseService {

    private final CourseRepository courseRepository;

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
}
