package edu.hcmute.peergradehub.dto.request.course;

public record CreateLessonMaterialRequest(
        String materialType,
        String title,
        String fileName,
        String filePath,
        Double fileSizeMb,
        String fileType,
        String url,
        String label
) {
}
