export interface TransitStep {
  type: "transit" | "walking";
  departureStop: string;
  arrivalStop: string;
  departureTime: string; // "HH:MM"
  arrivalTime: string; // "HH:MM"
  durationMinutes: number;
  lineName: string;
  lineShortName: string;
  lineColor: string;
  vehicleType: string;
  numStops: number;
  headsign: string;
}

export interface TransitRoute {
  departureTime: string; // "HH:MM"
  arrivalTime: string; // "HH:MM"
  departureTimeUnix: number;
  arrivalTimeUnix: number;
  durationMinutes: number;
  fare: number | null;
  fareText: string | null;
  transfers: number;
  steps: TransitStep[];
}
