-- Fix linked-list constraint violations by making constraints deferrable
-- and creating atomic RPC functions for linked-list operations.
--
-- Problem: The partial unique indexes (idx_itinerary_unique_prev,
-- idx_itinerary_first_per_day) are non-deferrable, causing constraint
-- violations during multi-step linked-list operations where the insert
-- and successor update cannot happen simultaneously.

-- 1. Drop non-deferrable partial unique indexes
DROP INDEX IF EXISTS idx_itinerary_unique_prev;
DROP INDEX IF EXISTS idx_itinerary_first_per_day;

-- 2. Replace with deferrable unique constraints

-- For unique prev: PostgreSQL UNIQUE allows multiple NULLs,
-- so this is equivalent to the old partial index (WHERE prev_item_id IS NOT NULL)
ALTER TABLE itinerary_items
  ADD CONSTRAINT uq_itinerary_unique_prev UNIQUE (prev_item_id)
  DEFERRABLE INITIALLY IMMEDIATE;

-- For first-per-day: Partial indexes can't be deferrable in PostgreSQL,
-- so use a generated column that's non-NULL only for head items
ALTER TABLE itinerary_items
  ADD COLUMN head_day_key TEXT GENERATED ALWAYS AS (
    CASE WHEN prev_item_id IS NULL
         THEN trip_id::text || '::' || day_number::text
         ELSE NULL
    END
  ) STORED;

ALTER TABLE itinerary_items
  ADD CONSTRAINT uq_itinerary_first_per_day UNIQUE (head_day_key)
  DEFERRABLE INITIALLY IMMEDIATE;

-- 3. RPC: Atomic insert into linked list
CREATE OR REPLACE FUNCTION create_itinerary_item(
  p_trip_id UUID,
  p_day_number INT,
  p_prev_item_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT '',
  p_description TEXT DEFAULT NULL,
  p_location_name TEXT DEFAULT NULL,
  p_departure_name TEXT DEFAULT NULL,
  p_arrival_name TEXT DEFAULT NULL,
  p_prefecture_code INT DEFAULT NULL,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_duration_minutes INT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_transport_type TEXT DEFAULT NULL,
  p_car_number TEXT DEFAULT NULL,
  p_seat_number TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_google_place_id TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_id UUID;
  v_successor_id UUID;
BEGIN
  SET CONSTRAINTS uq_itinerary_unique_prev, uq_itinerary_first_per_day DEFERRED;

  -- Find the current successor at the insertion point
  IF p_prev_item_id IS NOT NULL THEN
    SELECT id INTO v_successor_id
    FROM itinerary_items
    WHERE trip_id = p_trip_id
      AND day_number = p_day_number
      AND prev_item_id = p_prev_item_id
    FOR UPDATE;
  ELSE
    SELECT id INTO v_successor_id
    FROM itinerary_items
    WHERE trip_id = p_trip_id
      AND day_number = p_day_number
      AND prev_item_id IS NULL
    FOR UPDATE;
  END IF;

  -- Insert the new item
  INSERT INTO itinerary_items (
    trip_id, day_number, prev_item_id, title, description,
    location_name, departure_name, arrival_name, prefecture_code,
    latitude, longitude, start_time, end_time, duration_minutes,
    category, transport_type, car_number, seat_number, photo_url,
    google_place_id
  ) VALUES (
    p_trip_id, p_day_number, p_prev_item_id, p_title, p_description,
    p_location_name, p_departure_name, p_arrival_name, p_prefecture_code,
    p_latitude, p_longitude, p_start_time, p_end_time, p_duration_minutes,
    p_category, p_transport_type, p_car_number, p_seat_number, p_photo_url,
    p_google_place_id
  )
  RETURNING id INTO v_new_id;

  -- Update the successor to point to the new item
  IF v_successor_id IS NOT NULL THEN
    UPDATE itinerary_items
    SET prev_item_id = v_new_id
    WHERE id = v_successor_id;
  END IF;

  RETURN v_new_id;
END;
$$;

-- 4. RPC: Atomic delete from linked list
CREATE OR REPLACE FUNCTION delete_itinerary_item(
  p_item_id UUID
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_prev_item_id UUID;
BEGIN
  SET CONSTRAINTS uq_itinerary_unique_prev, uq_itinerary_first_per_day DEFERRED;

  -- Get the item's prev_item_id
  SELECT prev_item_id INTO v_prev_item_id
  FROM itinerary_items
  WHERE id = p_item_id
  FOR UPDATE;

  -- Update successor to skip this item
  UPDATE itinerary_items
  SET prev_item_id = v_prev_item_id
  WHERE prev_item_id = p_item_id;

  -- Delete the item
  DELETE FROM itinerary_items WHERE id = p_item_id;
END;
$$;

-- 5. RPC: Atomic position move within linked list
CREATE OR REPLACE FUNCTION move_itinerary_item(
  p_item_id UUID,
  p_trip_id UUID,
  p_new_day_number INT,
  p_new_prev_item_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_day INT;
  v_current_prev UUID;
  v_successor_id UUID;
BEGIN
  SET CONSTRAINTS uq_itinerary_unique_prev, uq_itinerary_first_per_day DEFERRED;

  -- Get current position
  SELECT day_number, prev_item_id INTO v_current_day, v_current_prev
  FROM itinerary_items
  WHERE id = p_item_id
  FOR UPDATE;

  -- Check if position actually changed
  IF v_current_day = p_new_day_number AND
     (v_current_prev IS NOT DISTINCT FROM p_new_prev_item_id) THEN
    RETURN;
  END IF;

  -- Step 1: Remove from old position (update old successor to skip this item)
  UPDATE itinerary_items
  SET prev_item_id = v_current_prev
  WHERE prev_item_id = p_item_id;

  -- Step 2: Find new successor at target position
  IF p_new_prev_item_id IS NOT NULL THEN
    SELECT id INTO v_successor_id
    FROM itinerary_items
    WHERE trip_id = p_trip_id
      AND day_number = p_new_day_number
      AND prev_item_id = p_new_prev_item_id
      AND id != p_item_id
    FOR UPDATE;
  ELSE
    SELECT id INTO v_successor_id
    FROM itinerary_items
    WHERE trip_id = p_trip_id
      AND day_number = p_new_day_number
      AND prev_item_id IS NULL
      AND id != p_item_id
    FOR UPDATE;
  END IF;

  -- Step 3: Update the new successor to point to this item
  IF v_successor_id IS NOT NULL THEN
    UPDATE itinerary_items
    SET prev_item_id = p_item_id
    WHERE id = v_successor_id;
  END IF;

  -- Step 4: Update the item's position
  UPDATE itinerary_items
  SET day_number = p_new_day_number,
      prev_item_id = p_new_prev_item_id
  WHERE id = p_item_id;
END;
$$;
