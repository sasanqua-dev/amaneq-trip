CREATE TYPE member_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role member_role DEFAULT 'viewer',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user_id ON trip_members(user_id);
