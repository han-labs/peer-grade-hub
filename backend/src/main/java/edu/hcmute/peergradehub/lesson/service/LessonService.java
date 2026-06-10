package edu.hcmute.peergradehub.lesson.service;

import edu.hcmute.peergradehub.course.model.Course;
import edu.hcmute.peergradehub.lesson.model.Lesson;
import edu.hcmute.peergradehub.lesson.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonService {

    private final LessonRepository lessonRepository;

    @Transactional
    public Lesson createLesson(String title, Course course) {
        Lesson lesson = Lesson.builder()
                .title(title)
                .course(course)
                .build();
        return lessonRepository.save(lesson);
    }
}
