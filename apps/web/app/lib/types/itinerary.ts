import type { ItineraryCategory, TransportType } from "@amaneq/core";

export interface ItineraryItem {
  id: string;
  dayNumber: number;
  prevItemId: string | null;
  title: string;
  description: string | null;
  locationName: string | null;
  departureName: string | null;
  arrivalName: string | null;
  prefectureCode: number | null;
  latitude: number | null;
  longitude: number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  category: ItineraryCategory | null;
  transportType: TransportType | null;
  carNumber: string | null;
  seatNumber: string | null;
  photoUrl: string | null;
  googlePlaceId: string | null;
}
