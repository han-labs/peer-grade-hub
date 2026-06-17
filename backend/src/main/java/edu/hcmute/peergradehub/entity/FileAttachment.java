package edu.hcmute.peergradehub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@DiscriminatorValue("FILE")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FileAttachment extends LessonMaterial {

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_path", columnDefinition = "TEXT")
    private String filePath;

    @Column(name = "file_size_mb")
    private Double fileSizeMb;

    @Column(name = "file_type", length = 100)
    private String fileType;
}
