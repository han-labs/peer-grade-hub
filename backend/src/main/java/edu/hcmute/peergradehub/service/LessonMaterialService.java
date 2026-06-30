package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.request.course.CreateLessonMaterialRequest;
import edu.hcmute.peergradehub.dto.response.course.LessonMaterialResponse;

public interface LessonMaterialService {
    LessonMaterialResponse createLessonMaterial(Long courseId, Long lessonId, CreateLessonMaterialRequest request, Long actorId);
    LessonMaterialResponse updateLessonMaterial(Long courseId, Long lessonId, Long materialId, CreateLessonMaterialRequest request, Long actorId);
    void deleteLessonMaterial(Long courseId, Long lessonId, Long materialId, Long actorId);
    LessonMaterialResponse uploadLessonMaterialFile(Long courseId, Long lessonId, org.springframework.web.multipart.MultipartFile file, String title, String label, Long actorId);
    LessonMaterialResponse updateLessonMaterialFile(Long courseId, Long lessonId, Long materialId, org.springframework.web.multipart.MultipartFile file, String title, String label, Long actorId);
    DownloadedLessonMaterialFile downloadLessonMaterialFile(Long courseId, Long lessonId, Long materialId, Long actorId);

    record DownloadedLessonMaterialFile(org.springframework.core.io.Resource resource, String fileName, String contentType) {}
}
