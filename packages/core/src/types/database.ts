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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "trips_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
          google_place_id: string | null;
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
          google_place_id?: string | null;
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
          google_place_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "itinerary_items_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "expenses_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "shared_trips_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "prefecture_visits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prefecture_visits_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform?: string | null;
          created_at?: string;
        };
        Update: {
          token?: string;
          platform?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_itinerary_item: {
        Args: {
          p_trip_id: string;
          p_day_number: number;
          p_prev_item_id?: string | null;
          p_title?: string;
          p_description?: string | null;
          p_location_name?: string | null;
          p_departure_name?: string | null;
          p_arrival_name?: string | null;
          p_prefecture_code?: number | null;
          p_latitude?: number | null;
          p_longitude?: number | null;
          p_start_time?: string | null;
          p_end_time?: string | null;
          p_duration_minutes?: number | null;
          p_category?: string | null;
          p_transport_type?: string | null;
          p_car_number?: string | null;
          p_seat_number?: string | null;
          p_photo_url?: string | null;
          p_google_place_id?: string | null;
        };
        Returns: string;
      };
      delete_itinerary_item: {
        Args: {
          p_item_id: string;
        };
        Returns: undefined;
      };
      move_itinerary_item: {
        Args: {
          p_item_id: string;
          p_trip_id: string;
          p_new_day_number: number;
          p_new_prev_item_id?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      trip_status: TripStatus;
      member_role: MemberRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
