package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.dao.LessonDao;
import edu.hcmute.peergradehub.dao.LessonMaterialDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.request.course.CreateLessonMaterialRequest;
import edu.hcmute.peergradehub.dto.response.course.LessonMaterialResponse;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.FileAttachment;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.entity.LinkAttachment;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.CourseStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ConflictException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.mapper.CourseMapper;
import edu.hcmute.peergradehub.service.LessonMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonMaterialServiceImpl implements LessonMaterialService {

    private final UserDao userDao;
    private final CourseDao courseDao;
    private final LessonDao lessonDao;
    private final LessonMaterialDao lessonMaterialDao;
    private final CourseMapper courseMapper;

    private static final double MAX_FILE_SIZE_MB = 20.0;
    private static final Set<String> ALLOWED_FILE_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "image/png",
            "image/jpeg"
    );

    @Override
    @Transactional
    public LessonMaterialResponse createLessonMaterial(Long courseId, Long lessonId, CreateLessonMaterialRequest request, Long actorId) {
        User actor = userDao.findById(actorId)
                .orElseThrow(() -> new NotFoundException("Actor not found."));

        if (actor.getUserRole() != UserRole.LECTURER || actor.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("You are not authorized to perform this action.");
        }

        Course course = courseDao.findByIdAndLecturerId(courseId, actorId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to manage this course."));

        if (course.getCourseStatus() != CourseStatus.ACTIVE) {
            throw new BadRequestException("This course is archived and cannot be modified.");
        }

        Lesson lesson = lessonDao.findByIdAndCourseId(lessonId, courseId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to manage this course."));

        if (!StringUtils.hasText(request.title())) {
            throw new BadRequestException("Material could not be saved. Please try again.");
        }

        if (!"FILE".equals(request.materialType()) && !"LINK".equals(request.materialType())) {
            throw new BadRequestException("Material could not be saved. Please try again.");
        }

        try {
            if ("FILE".equals(request.materialType())) {
                if (request.fileSizeMb() == null || request.fileSizeMb() > MAX_FILE_SIZE_MB) {
                    throw new BadRequestException("File size exceeds the maximum limit. Please select a different file or use a URL link.");
                }

                if (request.fileType() == null || !ALLOWED_FILE_TYPES.contains(request.fileType())) {
                    throw new BadRequestException("Invalid file type. Please select an allowed file type.");
                }

                if (!StringUtils.hasText(request.fileName()) || !StringUtils.hasText(request.filePath())) {
                    throw new BadRequestException("Material could not be saved. Please try again.");
                }

                FileAttachment fileAttachment = new FileAttachment();
                fileAttachment.setTitle(request.title());
                fileAttachment.setLesson(lesson);
                fileAttachment.setFileName(request.fileName());
                fileAttachment.setFilePath(request.filePath());
                fileAttachment.setFileSizeMb(request.fileSizeMb());
                fileAttachment.setFileType(request.fileType());

                FileAttachment saved = lessonMaterialDao.save(fileAttachment);
                return courseMapper.toMaterialResponse(saved);

            } else { // LINK
                if (!StringUtils.hasText(request.url()) || !isValidUrl(request.url())) {
                    throw new BadRequestException("Invalid URL. Please enter a valid link.");
                }

                LinkAttachment linkAttachment = new LinkAttachment();
                linkAttachment.setTitle(request.title());
                linkAttachment.setLesson(lesson);
                linkAttachment.setUrl(request.url());
                linkAttachment.setLabel(request.label());

                LinkAttachment saved = lessonMaterialDao.save(linkAttachment);
                return courseMapper.toMaterialResponse(saved);
            }
        } catch (BadRequestException | ForbiddenException | NotFoundException | ConflictException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Material could not be saved. Please try again.");
        }
    }

    private boolean isValidUrl(String urlString) {
        try {
            URI uri = new URI(urlString);
            return uri.getScheme() != null && uri.getHost() != null;
        } catch (Exception e) {
            return false;
        }
    }
}
