"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { loadPlacesLibrary } from "@/lib/google-maps";
import { MapPin } from "lucide-react";

export interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  addressComponents: google.maps.places.AddressComponent[];
  latitude: number;
  longitude: number;
  photoUrl: string | null;
}

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  includedPrimaryTypes?: string[];
}

export function PlaceAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  required,
  id,
  includedPrimaryTypes,
}: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ready, setReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load Google Places library
  useEffect(() => {
    let cancelled = false;
    loadPlacesLibrary()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        // API key not set or failed to load - autocomplete will be disabled
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!ready || input.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      try {
        const { suggestions: results } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input,
              includedRegionCodes: ["jp"],
              language: "ja",
              ...(includedPrimaryTypes && { includedPrimaryTypes }),
            }
          );

        const mapped: Suggestion[] = results
          .filter((s) => s.placePrediction)
          .map((s) => ({
            placeId: s.placePrediction!.placeId,
            mainText: s.placePrediction!.mainText?.text ?? "",
            secondaryText: s.placePrediction!.secondaryText?.text ?? "",
          }));

        setSuggestions(mapped);
        setIsOpen(mapped.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      }
    },
    [ready, includedPrimaryTypes]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  }

  async function handleSelect(suggestion: Suggestion) {
    onChange(suggestion.mainText);
    setIsOpen(false);
    setSuggestions([]);

    try {
      const place = new google.maps.places.Place({
        id: suggestion.placeId,
      });

      await place.fetchFields({
        fields: [
          "displayName",
          "formattedAddress",
          "addressComponents",
          "location",
          "photos",
        ],
      });

      let photoUrl: string | null = null;
      if (place.photos && place.photos.length > 0) {
        photoUrl = place.photos[0].getURI({ maxWidth: 800 });
      }

      onPlaceSelect({
        placeId: suggestion.placeId,
        name: place.displayName ?? "",
        formattedAddress: place.formattedAddress ?? "",
        addressComponents: place.addressComponents ?? [],
        latitude: place.location?.lat() ?? 0,
        longitude: place.location?.lng() ?? 0,
        photoUrl,
      });
    } catch {
      // Failed to fetch details - just use the name
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <ul className="max-h-60 overflow-y-auto py-1">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.placeId}>
                <button
                  type="button"
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    index === activeIndex ? "bg-accent" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(suggestion);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {suggestion.mainText}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {suggestion.secondaryText}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
