-- V4__alter_assignment_results_score_nullable.sql
ALTER TABLE assignment_results MODIFY COLUMN score DECIMAL(5,2) NULL;