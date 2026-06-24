package edu.hcmute.peergradehub.mapper;

import edu.hcmute.peergradehub.dto.response.course.CourseSummaryResponse;
import edu.hcmute.peergradehub.dto.response.course.CourseWorkspaceResponse;
import edu.hcmute.peergradehub.dto.response.course.LessonMaterialResponse;
import edu.hcmute.peergradehub.dto.response.course.LessonResponse;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.FileAttachment;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.entity.LessonMaterial;
import edu.hcmute.peergradehub.entity.LinkAttachment;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class CourseMapper {

    public CourseSummaryResponse toCourseSummary(Course course) {
        if (course == null) {
            return null;
        }

        String invitationLink = course.getInvitationCode() != null
                ? "/join/" + course.getInvitationCode()
                : null;

        return new CourseSummaryResponse(
                course.getId(),
                course.getCourseName(),
                course.getClassCode(),
                course.getInvitationCode(),
                invitationLink,
                course.getSemester(),
                course.getDescription(),
                course.getCourseStatus()
        );
    }

    public CourseWorkspaceResponse toWorkspace(Course course, List<Lesson> lessons, Map<Long, List<LessonMaterial>> materialsByLessonId) {
        if (course == null) {
            return null;
        }

        CourseSummaryResponse courseSummary = toCourseSummary(course);
        List<LessonResponse> lessonResponses = lessons != null
                ? lessons.stream()
                         .map(lesson -> {
                             List<LessonMaterial> materials = materialsByLessonId != null
                                     ? materialsByLessonId.getOrDefault(lesson.getId(), Collections.emptyList())
                                     : Collections.emptyList();
                             return toLessonResponse(lesson, materials);
                         })
                         .collect(Collectors.toList())
                : Collections.emptyList();

        return new CourseWorkspaceResponse(courseSummary, lessonResponses);
    }

    public LessonResponse toLessonResponse(Lesson lesson, List<LessonMaterial> materials) {
        if (lesson == null) {
            return null;
        }

        List<LessonMaterialResponse> materialResponses = materials != null
                ? materials.stream()
                           .map(this::toMaterialResponse)
                           .collect(Collectors.toList())
                : Collections.emptyList();

        return new LessonResponse(
                lesson.getId(),
                lesson.getTitle(),
                materialResponses
        );
    }

    public LessonMaterialResponse toMaterialResponse(LessonMaterial material) {
        if (material == null) {
            return null;
        }

        String materialType = null;
        String fileName = null;
        String filePath = null;
        Double fileSizeMb = null;
        String fileType = null;
        String url = null;
        String label = null;

        if (material instanceof FileAttachment fileAttachment) {
            materialType = "FILE";
            fileName = fileAttachment.getFileName();
            filePath = fileAttachment.getFilePath();
            fileSizeMb = fileAttachment.getFileSizeMb();
            fileType = fileAttachment.getFileType();
        } else if (material instanceof LinkAttachment linkAttachment) {
            materialType = "LINK";
            url = linkAttachment.getUrl();
            label = linkAttachment.getLabel();
        }

        return new LessonMaterialResponse(
                material.getId(),
                material.getTitle(),
                materialType,
                fileName,
                filePath,
                fileSizeMb,
                fileType,
                url,
                label
        );
    }
}
