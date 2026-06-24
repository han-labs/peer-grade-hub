package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.request.course.CreateLessonRequest;
import edu.hcmute.peergradehub.dto.response.course.LessonResponse;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;

public interface LessonService {
    Lesson createLesson(String title, Course course);
    LessonResponse createLesson(Long courseId, CreateLessonRequest request, Long actorId);
}
