# Render

Use Render or a similar platform for the Spring Boot backend.

Recommended backend settings:

- Runtime: Docker or Java.
- Java version: 17.
- Build command: `./mvnw clean package -DskipTests`.
- Start command: `java -jar target/peergradehub-0.0.1-SNAPSHOT.jar`.
- Environment variables: copy the backend values from `.env.example` and use a cloud MySQL 8.0 database URL/host.
