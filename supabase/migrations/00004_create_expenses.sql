CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  itinerary_item_id UUID REFERENCES itinerary_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount INT NOT NULL,
  currency TEXT DEFAULT 'JPY',
  category TEXT CHECK (category IS NULL OR category IN ('transport', 'accommodation', 'food', 'ticket', 'shopping', 'other')),
  paid_by UUID REFERENCES users(id),
  split_among UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
