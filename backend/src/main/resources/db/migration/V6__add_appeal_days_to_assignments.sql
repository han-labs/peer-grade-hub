-- V5__add_appeal_days_to_assignments.sql
ALTER TABLE assignments ADD COLUMN appeal_days INT NOT NULL DEFAULT 7;
