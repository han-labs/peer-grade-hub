package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.User;

public interface CourseService {
    Course createCourse(String courseName, String classCode, String semester, User lecturer, String description);
}
