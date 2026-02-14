"use server";

import { revalidatePath } from "next/cache";
import { ensureUser } from "@/lib/auth0";
import { createServerClient } from "@/lib/supabase/server";
import type { TransitRoute, TransitStep } from "@/lib/types/train-search";
import type { TransportType } from "@/lib/supabase/types";

// --- Google Directions API types (subset) ---

interface DirectionsResponse {
  status: string;
  routes: DirectionsRoute[];
  error_message?: string;
}

interface DirectionsRoute {
  legs: DirectionsLeg[];
  fare?: { currency: string; text: string; value: number };
}

interface DirectionsLeg {
  departure_time: { text: string; value: number };
  arrival_time: { text: string; value: number };
  duration: { text: string; value: number };
  steps: DirectionsStep[];
}

interface DirectionsStep {
  travel_mode: "TRANSIT" | "WALKING";
  duration: { text: string; value: number };
  html_instructions: string;
  transit_details?: {
    departure_stop: { name: string };
    arrival_stop: { name: string };
    departure_time: { text: string; value: number };
    arrival_time: { text: string; value: number };
    line: {
      name: string;
      short_name: string;
      color?: string;
      vehicle: { type: string; name: string };
    };
    num_stops: number;
    headsign: string;
  };
}

// --- Vehicle type → TransportType mapping ---

function mapVehicleType(
  vehicleType: string,
  lineName: string
): TransportType {
  if (lineName.includes("新幹線") || vehicleType === "HIGH_SPEED_TRAIN") {
    return "shinkansen";
  }
  if (lineName.includes("特急")) {
    return "express";
  }
  if (
    vehicleType === "BUS" ||
    vehicleType === "INTERCITY_BUS" ||
    vehicleType === "TROLLEYBUS"
  ) {
    return "bus";
  }
  if (vehicleType === "FERRY") {
    return "ship";
  }
  return "local_train";
}

// --- Helpers ---

function unixToHHMM(unix: number): string {
  const d = new Date(unix * 1000);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function parseDirectionsRoute(route: DirectionsRoute): TransitRoute | null {
  const leg = route.legs[0];
  if (!leg) return null;

  const steps: TransitStep[] = [];

  for (const step of leg.steps) {
    if (step.travel_mode === "TRANSIT" && step.transit_details) {
      const td = step.transit_details;
      steps.push({
        type: "transit",
        departureStop: td.departure_stop.name,
        arrivalStop: td.arrival_stop.name,
        departureTime: unixToHHMM(td.departure_time.value),
        arrivalTime: unixToHHMM(td.arrival_time.value),
        durationMinutes: Math.round(
          (td.arrival_time.value - td.departure_time.value) / 60
        ),
        lineName: td.line.name,
        lineShortName: td.line.short_name || "",
        lineColor: td.line.color || "#6b7280",
        vehicleType: td.line.vehicle.type,
        numStops: td.num_stops,
        headsign: td.headsign,
      });
    } else if (step.travel_mode === "WALKING" && step.duration.value >= 120) {
      // Only include walks of 2+ minutes
      steps.push({
        type: "walking",
        departureStop: "",
        arrivalStop: "",
        departureTime: "",
        arrivalTime: "",
        durationMinutes: Math.round(step.duration.value / 60),
        lineName: "徒歩",
        lineShortName: "",
        lineColor: "#9ca3af",
        vehicleType: "WALKING",
        numStops: 0,
        headsign: "",
      });
    }
  }

  if (steps.filter((s) => s.type === "transit").length === 0) return null;

  const transfers = steps.filter((s) => s.type === "transit").length - 1;

  return {
    departureTime: unixToHHMM(leg.departure_time.value),
    arrivalTime: unixToHHMM(leg.arrival_time.value),
    departureTimeUnix: leg.departure_time.value,
    arrivalTimeUnix: leg.arrival_time.value,
    durationMinutes: Math.round(leg.duration.value / 60),
    fare: route.fare?.value ?? null,
    fareText: route.fare?.text ?? null,
    transfers,
    steps,
  };
}

// --- Public server actions ---

export async function searchTransitRoutes(
  origin: string,
  destination: string,
  departureTimeUnix: number
): Promise<{ routes: TransitRoute[]; error?: string }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { routes: [], error: "Google Maps APIキーが設定されていません" };
  }

  const params = new URLSearchParams({
    origin,
    destination,
    mode: "transit",
    departure_time: String(departureTimeUnix),
    alternatives: "true",
    language: "ja",
    region: "jp",
    key: apiKey,
  });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return { routes: [], error: "経路の検索に失敗しました" };
    }

    const data: DirectionsResponse = await res.json();

    if (data.status === "ZERO_RESULTS") {
      return { routes: [], error: "該当する経路が見つかりませんでした" };
    }

    if (data.status !== "OK") {
      return {
        routes: [],
        error: data.error_message || "経路の検索に失敗しました",
      };
    }

    const routes = data.routes
      .map(parseDirectionsRoute)
      .filter((r): r is TransitRoute => r !== null)
      .sort((a, b) => a.departureTimeUnix - b.departureTimeUnix);

    // Deduplicate by departure+arrival time combo
    const seen = new Set<string>();
    const unique = routes.filter((r) => {
      const key = `${r.departureTime}-${r.arrivalTime}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { routes: unique };
  } catch {
    return { routes: [], error: "ネットワークエラーが発生しました" };
  }
}

export async function addTransitRouteToItinerary(
  tripId: string,
  dayNumber: number,
  prevItemId: string | null,
  route: TransitRoute
) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();

  // Check membership
  const { data: memberData } = await supabase
    .from("trip_members")
    .select()
    .eq("trip_id", tripId)
    .eq("user_id", user.dbId)
    .single();

  if (!memberData || (memberData as { role: string }).role === "viewer") {
    throw new Error("Permission denied");
  }

  const transitSteps = route.steps.filter((s) => s.type === "transit");
  let currentPrevItemId = prevItemId;

  for (const step of transitSteps) {
    const transportType = mapVehicleType(step.vehicleType, step.lineName);

    const title = step.lineShortName
      ? `${step.lineName} ${step.lineShortName}`
      : step.lineName;

    const description = step.headsign ? `${step.headsign}方面` : null;

    const { data: newId, error } = await supabase.rpc(
      "create_itinerary_item",
      {
        p_trip_id: tripId,
        p_day_number: dayNumber,
        p_prev_item_id: currentPrevItemId,
        p_title: title,
        p_description: description,
        p_location_name: null,
        p_departure_name: step.departureStop,
        p_arrival_name: step.arrivalStop,
        p_prefecture_code: null,
        p_latitude: null,
        p_longitude: null,
        p_start_time: step.departureTime,
        p_end_time: step.arrivalTime,
        p_duration_minutes: null,
        p_category: "transport",
        p_transport_type: transportType,
        p_car_number: null,
        p_seat_number: null,
        p_photo_url: null,
        p_google_place_id: null,
      }
    );

    if (error) {
      throw new Error(`Failed to add route: ${error.message}`);
    }

    // Chain next item after this one
    if (newId && typeof newId === "string") {
      currentPrevItemId = newId;
    } else {
      // If RPC doesn't return ID, query for the item we just created
      const { data: items } = await supabase
        .from("itinerary_items")
        .select("id")
        .eq("trip_id", tripId)
        .eq("day_number", dayNumber)
        .eq("prev_item_id", currentPrevItemId)
        .neq("id", currentPrevItemId ?? "")
        .limit(1)
        .single();

      if (items) {
        currentPrevItemId = (items as { id: string }).id;
      }
    }
  }

  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}`);
}
