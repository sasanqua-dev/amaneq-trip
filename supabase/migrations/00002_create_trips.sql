CREATE TYPE trip_status AS ENUM ('draft', 'planned', 'ongoing', 'completed');

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status trip_status DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trips_owner_id ON trips(owner_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_start_date ON trips(start_date);
