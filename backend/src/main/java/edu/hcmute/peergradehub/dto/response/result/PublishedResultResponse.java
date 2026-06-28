package edu.hcmute.peergradehub.dto.response.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for UC-10 View Published Results.
 * Contains personal results and optionally showcase gallery.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishedResultResponse {

    private Boolean isPublished;
    private String message; // "Your results are still being processed" if not published
    private PersonalResultResponse personalResult;
    private Boolean showcaseMode;
    private ShowcaseGalleryResponse showcaseGallery; // null if showcaseMode is false
}