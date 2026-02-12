import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
  }
  setOptions({
    key: apiKey,
    language: "ja",
    region: "JP",
  });
  initialized = true;
}

export async function loadPlacesLibrary() {
  ensureInitialized();
  return importLibrary("places");
}
