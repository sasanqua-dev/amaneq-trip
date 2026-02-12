ALTER TABLE itinerary_items
  ADD COLUMN transport_type TEXT CHECK (
    transport_type IS NULL OR transport_type IN (
      'shinkansen', 'express', 'local_train', 'bus',
      'ship', 'airplane', 'car', 'taxi', 'walk', 'bicycle', 'other'
    )
  ),
  ADD COLUMN car_number TEXT,
  ADD COLUMN seat_number TEXT;
