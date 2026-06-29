package edu.hcmute.peergradehub.dto.response.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Class Gallery data for Showcase Mode.
 * Only shows submissions and anonymous feedback, not unpublished grades (BR-15).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShowcaseGalleryResponse {

    private Boolean enabled;
    private String message; // "Lecturer has not permitted viewing other groups' submissions." if disabled
    private List<ShowcaseSubmissionResponse> submissions;
}