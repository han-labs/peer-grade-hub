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
import edu.hcmute.peergradehub.entity.LessonMaterial;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import edu.hcmute.peergradehub.dao.CourseEnrollmentDao;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonMaterialServiceImpl implements LessonMaterialService {

    private final UserDao userDao;
    private final CourseDao courseDao;
    private final LessonDao lessonDao;
    private final LessonMaterialDao lessonMaterialDao;
    private final CourseMapper courseMapper;
    private final CourseEnrollmentDao courseEnrollmentDao;

    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;

    private static final double MAX_FILE_SIZE_MB = 20.0;
    private static final Set<String> ALLOWED_FILE_TYPES = Set.of(
            "pdf", "doc", "docx", "ppt", "pptx", "txt", "png", "jpg", "jpeg", "zip", "rar"
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

    @Override
    @Transactional
    public LessonMaterialResponse updateLessonMaterial(Long courseId, Long lessonId, Long materialId, CreateLessonMaterialRequest request, Long actorId) {
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

        LessonMaterial material = lessonMaterialDao.findById(materialId)
                .orElseThrow(() -> new NotFoundException("Lesson material not found."));

        if (material.getLesson() == null || !material.getLesson().getId().equals(lessonId) 
                || !material.getLesson().getCourse().getId().equals(courseId)) {
            throw new ForbiddenException("You are not authorized to update this material.");
        }

        if (!StringUtils.hasText(request.title())) {
            throw new BadRequestException("Material could not be saved. Please try again.");
        }

        if (!"FILE".equals(request.materialType()) && !"LINK".equals(request.materialType())) {
            throw new BadRequestException("Material could not be saved. Please try again.");
        }

        try {
            if ("FILE".equals(request.materialType())) {
                if (!(material instanceof FileAttachment fileAttachment)) {
                    throw new BadRequestException("Cannot change material type.");
                }

                if (request.fileSizeMb() == null || request.fileSizeMb() > MAX_FILE_SIZE_MB || request.fileSizeMb() <= 0) {
                    throw new BadRequestException("File size exceeds the maximum limit. Please select a different file or use a URL link.");
                }

                if (request.fileType() == null || !ALLOWED_FILE_TYPES.contains(request.fileType())) {
                    throw new BadRequestException("Invalid file type. Please select an allowed file type.");
                }

                if (!StringUtils.hasText(request.fileName()) || !StringUtils.hasText(request.filePath())) {
                    throw new BadRequestException("Material could not be saved. Please try again.");
                }

                fileAttachment.setTitle(request.title());
                fileAttachment.setFileName(request.fileName());
                fileAttachment.setFilePath(request.filePath());
                fileAttachment.setFileSizeMb(request.fileSizeMb());
                fileAttachment.setFileType(request.fileType());

                FileAttachment saved = lessonMaterialDao.save(fileAttachment);
                return courseMapper.toMaterialResponse(saved);

            } else { // LINK
                if (!(material instanceof LinkAttachment linkAttachment)) {
                    throw new BadRequestException("Cannot change material type.");
                }

                if (!StringUtils.hasText(request.url()) || !isValidUrl(request.url())) {
                    throw new BadRequestException("Invalid URL. Please enter a valid link.");
                }

                linkAttachment.setTitle(request.title());
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

    @Override
    @Transactional
    public void deleteLessonMaterial(Long courseId, Long lessonId, Long materialId, Long actorId) {
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

        LessonMaterial material = lessonMaterialDao.findById(materialId)
                .orElseThrow(() -> new NotFoundException("Lesson material not found."));

        if (material.getLesson() == null || !material.getLesson().getId().equals(lessonId) 
                || !material.getLesson().getCourse().getId().equals(courseId)) {
            throw new ForbiddenException("You are not authorized to delete this material.");
        }

        if (material instanceof FileAttachment fileAttachment) {
            deletePhysicalFileIfExists(fileAttachment.getFilePath());
        }

        lessonMaterialDao.delete(material);
    }

    private void deletePhysicalFileIfExists(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }
        try {
            Path targetPath = resolveStoredFilePath(filePath);
            if (Files.exists(targetPath) && Files.isRegularFile(targetPath)) {
                Files.delete(targetPath);
            }
        } catch (Exception e) {
            // Log warning or ignore if physical delete fails, we still want DB delete to succeed
        }
    }

    @Override
    @Transactional
    public LessonMaterialResponse uploadLessonMaterialFile(Long courseId, Long lessonId, MultipartFile file, String title, String label, Long actorId) {
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

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is missing or empty.");
        }

        String safeFileName = sanitizeOriginalFilename(file.getOriginalFilename());
        String displayFileName = cleanDisplayFileName(file.getOriginalFilename());
        String fileType = normalizeFileType(null, displayFileName);
        
        if (fileType == null || !ALLOWED_FILE_TYPES.contains(fileType)) {
            throw new BadRequestException("Invalid file type. Please upload only the allowed file types.");
        }

        long maxBytes = (long) (MAX_FILE_SIZE_MB * 1024L * 1024L);
        if (file.getSize() <= 0 || file.getSize() > maxBytes) {
            throw new BadRequestException("File size exceeds the allowed limit.");
        }

        Path uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        Path relativePath = Path.of("lesson-materials")
                .resolve(String.valueOf(lessonId))
                .resolve(UUID.randomUUID() + "_" + safeFileName)
                .normalize();
        
        Path lessonDir = uploadRoot.resolve("lesson-materials").resolve(String.valueOf(lessonId)).normalize();
        Path targetPath = uploadRoot.resolve(relativePath).normalize();

        if (!targetPath.startsWith(lessonDir)) {
            throw new BadRequestException("File could not be saved. Please try again.");
        }

        try {
            Files.createDirectories(lessonDir);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("File could not be saved. Please try again.");
        }

        double fileSizeMb = Math.max(0.01, Math.round((file.getSize() * 100.0) / (1024.0 * 1024.0)) / 100.0);
        String finalTitle = StringUtils.hasText(title) ? title : displayFileName;

        FileAttachment fileAttachment = new FileAttachment();
        fileAttachment.setTitle(finalTitle);
        fileAttachment.setLesson(lesson);
        fileAttachment.setFileName(displayFileName);
        fileAttachment.setFilePath(relativePath.toString().replace("\\", "/"));
        fileAttachment.setFileSizeMb(fileSizeMb);
        fileAttachment.setFileType(fileType);

        FileAttachment saved = lessonMaterialDao.save(fileAttachment);
        return courseMapper.toMaterialResponse(saved);
    }

    @Override
    @Transactional
    public LessonMaterialResponse updateLessonMaterialFile(Long courseId, Long lessonId, Long materialId, MultipartFile file, String title, String label, Long actorId) {
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

        LessonMaterial material = lessonMaterialDao.findById(materialId)
                .orElseThrow(() -> new NotFoundException("Material not found."));

        if (material.getLesson() == null || !material.getLesson().getId().equals(lessonId) 
                || !material.getLesson().getCourse().getId().equals(courseId)) {
            throw new ForbiddenException("You are not authorized to edit this material.");
        }

        if (!(material instanceof FileAttachment fileAttachment)) {
            throw new BadRequestException("Material is not a file attachment.");
        }

        if (StringUtils.hasText(title)) {
            fileAttachment.setTitle(title);
        }
        // ignoring label as before

        if (file != null && !file.isEmpty()) {
            String safeFileName = sanitizeOriginalFilename(file.getOriginalFilename());
            String displayFileName = cleanDisplayFileName(file.getOriginalFilename());
            String fileType = normalizeFileType(null, displayFileName);
            
            if (fileType == null || !ALLOWED_FILE_TYPES.contains(fileType)) {
                throw new BadRequestException("Invalid file type. Please upload only the allowed file types.");
            }

            long maxBytes = (long) (MAX_FILE_SIZE_MB * 1024L * 1024L);
            if (file.getSize() <= 0 || file.getSize() > maxBytes) {
                throw new BadRequestException("File size exceeds the allowed limit.");
            }

            Path uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
            Path relativePath = Path.of("lesson-materials")
                    .resolve(String.valueOf(lessonId))
                    .resolve(UUID.randomUUID() + "_" + safeFileName)
                    .normalize();
            
            Path lessonDir = uploadRoot.resolve("lesson-materials").resolve(String.valueOf(lessonId)).normalize();
            Path targetPath = uploadRoot.resolve(relativePath).normalize();

            if (!targetPath.startsWith(lessonDir)) {
                throw new BadRequestException("File could not be saved. Please try again.");
            }

            try {
                Files.createDirectories(lessonDir);
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException exception) {
                throw new BadRequestException("File could not be saved. Please try again.");
            }

            // delete old file physical
            deletePhysicalFileIfExists(fileAttachment.getFilePath());

            double fileSizeMb = Math.max(0.01, Math.round((file.getSize() * 100.0) / (1024.0 * 1024.0)) / 100.0);
            fileAttachment.setFileName(displayFileName);
            fileAttachment.setFilePath(relativePath.toString().replace("\\", "/"));
            fileAttachment.setFileSizeMb(fileSizeMb);
            fileAttachment.setFileType(fileType);
            if (!StringUtils.hasText(title)) {
                fileAttachment.setTitle(displayFileName);
            }
        }

        FileAttachment saved = lessonMaterialDao.save(fileAttachment);
        return courseMapper.toMaterialResponse(saved);
    }

    private String cleanDisplayFileName(String originalFileName) {
        String cleaned = StringUtils.cleanPath(
                originalFileName == null || originalFileName.isBlank()
                        ? "material-file"
                        : originalFileName
        ).replace("\\", "/");
        int slashIndex = cleaned.lastIndexOf('/');
        if (slashIndex >= 0) {
            cleaned = cleaned.substring(slashIndex + 1);
        }
        if (cleaned.isBlank() || cleaned.equals(".") || cleaned.equals("..")) {
            return "material-file";
        }
        return cleaned;
    }

    private String sanitizeOriginalFilename(String originalFileName) {
        String cleaned = cleanDisplayFileName(originalFileName);
        cleaned = cleaned.replaceAll("[^a-zA-Z0-9._-]", "_");
        return cleaned;
    }

    private String normalizeFileType(String fileType, String fileName) {
        String extension = null;
        if (fileName != null && fileName.contains(".")) {
            extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        }

        if (extension != null && !extension.isBlank()) {
            return extension;
        }

        // Fallback to MIME type mapping if extension not found
        if (fileType != null && !fileType.isBlank()) {
            String mime = fileType.trim().toLowerCase(Locale.ROOT);
            return switch (mime) {
                case "application/pdf" -> "pdf";
                case "image/png" -> "png";
                case "image/jpeg", "image/jpg" -> "jpg";
                case "text/plain" -> "txt";
                case "application/zip", "application/x-zip-compressed" -> "zip";
                case "application/msword" -> "doc";
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> "docx";
                case "application/vnd.ms-powerpoint" -> "ppt";
                case "application/vnd.openxmlformats-officedocument.presentationml.presentation" -> "pptx";
                case "application/x-rar-compressed", "application/rar" -> "rar";
                default -> mime;
            };
        }
        return null;
    }

    private Path resolveStoredFilePath(String filePath) {
        String storedPath = filePath != null && !filePath.isBlank() ? filePath.trim() : null;
        if (storedPath == null) {
            throw new NotFoundException("File is not available for download.");
        }
        
        Path uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        Path candidatePath = Path.of(storedPath);
        Path resolvedPath = candidatePath.isAbsolute()
                ? candidatePath.normalize()
                : uploadRoot.resolve(candidatePath).normalize();

        if (!resolvedPath.startsWith(uploadRoot)) {
            throw new NotFoundException("File is not available for download.");
        }
        return resolvedPath;
    }

    @Override
    public DownloadedLessonMaterialFile downloadLessonMaterialFile(Long courseId, Long lessonId, Long materialId, Long actorId) {
        User actor = userDao.findById(actorId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to perform this action."));

        Course course = courseDao.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found."));

        // Verify permissions
        if (actor.getUserRole() == UserRole.STUDENT) {
            if (!courseEnrollmentDao.existsByCourseIdAndStudentId(courseId, actorId)) {
                throw new ForbiddenException("You are not enrolled in this course.");
            }
        } else if (actor.getUserRole() == UserRole.LECTURER) {
            if (course.getLecturer() == null || !course.getLecturer().getId().equals(actorId)) {
                throw new ForbiddenException("You are not authorized to access this course.");
            }
        } else {
            throw new ForbiddenException("You are not authorized to perform this action.");
        }

        LessonMaterial material = lessonMaterialDao.findById(materialId)
                .orElseThrow(() -> new NotFoundException("File is not available for download."));

        if (material.getLesson() == null || !material.getLesson().getId().equals(lessonId) 
                || !material.getLesson().getCourse().getId().equals(courseId)) {
            throw new NotFoundException("File is not available for download.");
        }

        if (!(material instanceof FileAttachment fileAttachment)) {
            throw new NotFoundException("File is not available for download.");
        }

        Path storedPath = resolveStoredFilePath(fileAttachment.getFilePath());
        if (!Files.isRegularFile(storedPath) || !Files.isReadable(storedPath)) {
            throw new NotFoundException("File is not available for download.");
        }

        try {
            Resource resource = new UrlResource(storedPath.toUri());
            String contentType = Files.probeContentType(storedPath);
            if (contentType == null || contentType.isBlank()) {
                contentType = "application/octet-stream";
            }
            String finalName = fileAttachment.getFileName() != null ? fileAttachment.getFileName() : storedPath.getFileName().toString();
            return new DownloadedLessonMaterialFile(resource, finalName, contentType);
        } catch (IOException exception) {
            throw new NotFoundException("File is not available for download.");
        }
    }
}
