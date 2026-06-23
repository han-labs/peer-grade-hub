package edu.hcmute.peergradehub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@DiscriminatorValue("LINK")
@Getter
@Setter
@NoArgsConstructor
public class LinkAttachment extends LessonMaterial {

    @Column(name = "url", columnDefinition = "TEXT")
    private String url;

    @Column(name = "label", length = 255)
    private String label;
}
