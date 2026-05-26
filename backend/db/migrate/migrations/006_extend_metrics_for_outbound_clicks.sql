ALTER TABLE metrics
  ADD COLUMN target_url VARCHAR(500) NULL AFTER nav_item_id,
  ADD COLUMN target_label VARCHAR(255) NULL AFTER target_url,
  ADD COLUMN source_context VARCHAR(128) NULL AFTER target_label;
