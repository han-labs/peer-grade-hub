package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.request.course.CreateLessonMaterialRequest;
import edu.hcmute.peergradehub.dto.response.course.LessonMaterialResponse;

public interface LessonMaterialService {
    LessonMaterialResponse createLessonMaterial(Long courseId, Long lessonId, CreateLessonMaterialRequest request, Long actorId);
    void deleteLessonMaterial(Long courseId, Long lessonId, Long materialId, Long actorId);
}
