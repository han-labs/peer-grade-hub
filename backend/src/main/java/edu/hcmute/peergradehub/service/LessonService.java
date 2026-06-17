package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;

public interface LessonService {
    Lesson createLesson(String title, Course course);
}
