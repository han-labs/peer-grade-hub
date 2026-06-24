package edu.hcmute.peergradehub.dto.response.course;

public record LessonMaterialResponse(
        Long id,
        String title,
        String materialType,
        String fileName,
        String filePath,
        Double fileSizeMb,
        String fileType,
        String url,
        String label
) {
}
