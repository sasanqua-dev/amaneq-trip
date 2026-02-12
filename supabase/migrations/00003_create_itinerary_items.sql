CREATE TABLE itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  day_number INT NOT NULL,
  order_index INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  prefecture_code INT CHECK (prefecture_code IS NULL OR (prefecture_code BETWEEN 1 AND 47)),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  start_time TIME,
  end_time TIME,
  category TEXT CHECK (category IS NULL OR category IN ('transport', 'sightseeing', 'meal', 'accommodation', 'other')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX idx_itinerary_items_day_order ON itinerary_items(trip_id, day_number, order_index);
