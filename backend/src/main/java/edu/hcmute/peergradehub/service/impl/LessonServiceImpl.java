package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.LessonDao;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonServiceImpl implements LessonService {

    private final LessonDao lessonRepository;

    @Override
    @Transactional
    public Lesson createLesson(String title, Course course) {
        Lesson lesson = Lesson.builder()
                .title(title)
                .course(course)
                .build();
        return lessonRepository.save(lesson);
    }
}
