CREATE TABLE prefecture_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  prefecture_code INT NOT NULL CHECK (prefecture_code BETWEEN 1 AND 47),
  visited_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, trip_id, prefecture_code)
);

CREATE INDEX idx_prefecture_visits_user_id ON prefecture_visits(user_id);
CREATE INDEX idx_prefecture_visits_prefecture ON prefecture_visits(prefecture_code);
