CREATE TABLE shared_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  permission member_role DEFAULT 'viewer',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shared_trips_token ON shared_trips(share_token);
CREATE INDEX idx_shared_trips_trip_id ON shared_trips(trip_id);
