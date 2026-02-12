export type TripStatus = "draft" | "planned" | "ongoing" | "completed";
export type MemberRole = "owner" | "editor" | "viewer";
export type ExpenseCategory =
  | "transport"
  | "accommodation"
  | "food"
  | "ticket"
  | "shopping"
  | "other";
export type ItineraryCategory =
  | "transport"
  | "sightseeing"
  | "meal"
  | "accommodation"
  | "other";
export type TransportType =
  | "shinkansen"
  | "express"
  | "local_train"
  | "bus"
  | "ship"
  | "airplane"
  | "car"
  | "taxi"
  | "walk"
  | "bicycle"
  | "other";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth0_id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth0_id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth0_id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          status: TripStatus;
          start_date: string | null;
          end_date: string | null;
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          status?: TripStatus;
          start_date?: string | null;
          end_date?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: TripStatus;
          start_date?: string | null;
          end_date?: string | null;
          cover_image_url?: string | null;
          updated_at?: string;
        };
      };
      itinerary_items: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          prev_item_id: string | null;
          title: string;
          description: string | null;
          location_name: string | null;
          departure_name: string | null;
          arrival_name: string | null;
          prefecture_code: number | null;
          latitude: number | null;
          longitude: number | null;
          start_time: string | null;
          end_time: string | null;
          duration_minutes: number | null;
          category: ItineraryCategory | null;
          transport_type: TransportType | null;
          car_number: string | null;
          seat_number: string | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_number: number;
          prev_item_id?: string | null;
          title: string;
          description?: string | null;
          location_name?: string | null;
          departure_name?: string | null;
          arrival_name?: string | null;
          prefecture_code?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          duration_minutes?: number | null;
          category?: ItineraryCategory | null;
          transport_type?: TransportType | null;
          car_number?: string | null;
          seat_number?: string | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          day_number?: number;
          prev_item_id?: string | null;
          title?: string;
          description?: string | null;
          location_name?: string | null;
          departure_name?: string | null;
          arrival_name?: string | null;
          prefecture_code?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          duration_minutes?: number | null;
          category?: ItineraryCategory | null;
          transport_type?: TransportType | null;
          car_number?: string | null;
          seat_number?: string | null;
          photo_url?: string | null;
        };
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          itinerary_item_id: string | null;
          title: string;
          amount: number;
          currency: string;
          category: ExpenseCategory | null;
          paid_by: string | null;
          split_among: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          itinerary_item_id?: string | null;
          title: string;
          amount: number;
          currency?: string;
          category?: ExpenseCategory | null;
          paid_by?: string | null;
          split_among?: string[];
          created_at?: string;
        };
        Update: {
          title?: string;
          amount?: number;
          currency?: string;
          category?: ExpenseCategory | null;
          paid_by?: string | null;
          split_among?: string[];
        };
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: MemberRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          role?: MemberRole;
          joined_at?: string;
        };
        Update: {
          role?: MemberRole;
        };
      };
      shared_trips: {
        Row: {
          id: string;
          trip_id: string;
          share_token: string;
          permission: MemberRole;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          share_token?: string;
          permission?: MemberRole;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          permission?: MemberRole;
          expires_at?: string | null;
          is_active?: boolean;
        };
      };
      prefecture_visits: {
        Row: {
          id: string;
          user_id: string;
          trip_id: string;
          prefecture_code: number;
          visited_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trip_id: string;
          prefecture_code: number;
          visited_at?: string | null;
          created_at?: string;
        };
        Update: {
          prefecture_code?: number;
          visited_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      trip_status: TripStatus;
      member_role: MemberRole;
    };
  };
}
