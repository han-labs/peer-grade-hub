package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseServiceImpl implements CourseService {

    private final CourseDao courseRepository;

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
}
