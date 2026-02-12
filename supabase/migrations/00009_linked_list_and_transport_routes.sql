-- Add departure/arrival columns for transport items
ALTER TABLE itinerary_items
  ADD COLUMN departure_name TEXT,
  ADD COLUMN arrival_name TEXT;

-- Add linked-list ordering column (replaces order_index)
ALTER TABLE itinerary_items
  ADD COLUMN prev_item_id UUID REFERENCES itinerary_items(id) ON DELETE SET NULL;

-- Migrate order_index to linked list per (trip_id, day_number)
UPDATE itinerary_items AS curr
SET prev_item_id = prev.id
FROM itinerary_items AS prev
WHERE curr.trip_id = prev.trip_id
  AND curr.day_number = prev.day_number
  AND curr.order_index = prev.order_index + 1;

-- Drop order_index (replaced by prev_item_id linked list)
ALTER TABLE itinerary_items DROP COLUMN order_index;

-- Ensure at most one first item per (trip_id, day_number)
CREATE UNIQUE INDEX idx_itinerary_first_per_day
ON itinerary_items (trip_id, day_number)
WHERE prev_item_id IS NULL;

-- Ensure each item can be predecessor of at most one other item
CREATE UNIQUE INDEX idx_itinerary_unique_prev
ON itinerary_items (prev_item_id)
WHERE prev_item_id IS NOT NULL;
