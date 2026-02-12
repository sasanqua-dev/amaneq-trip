-- Add duration_minutes column for items specified by duration instead of exact times
ALTER TABLE itinerary_items
  ADD COLUMN duration_minutes INT CHECK (duration_minutes IS NULL OR duration_minutes > 0);
