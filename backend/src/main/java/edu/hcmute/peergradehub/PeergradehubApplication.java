package edu.hcmute.peergradehub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class PeergradehubApplication {

	private static final String CANONICAL_TIME_ZONE = "Asia/Ho_Chi_Minh";
	private static final String LEGACY_TIME_ZONE = "Asia/Saigon";

	static {
		normalizeTimeZone();
	}

	public static void main(String[] args) {
		SpringApplication.run(PeergradehubApplication.class, args);
	}

	private static void normalizeTimeZone() {
		String configuredTimeZone = System.getProperty("user.timezone");

		if (configuredTimeZone == null || configuredTimeZone.isBlank() || LEGACY_TIME_ZONE.equals(configuredTimeZone)) {
			System.setProperty("user.timezone", CANONICAL_TIME_ZONE);
			TimeZone.setDefault(TimeZone.getTimeZone(CANONICAL_TIME_ZONE));
		}
	}

}
