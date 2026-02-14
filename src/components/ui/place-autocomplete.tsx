"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { loadPlacesLibrary } from "@/lib/google-maps";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { PlaceSuggestionList, type PlaceSuggestion } from "@/components/ui/place-suggestion-list";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Search } from "lucide-react";

export interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  addressComponents: google.maps.places.AddressComponent[];
  latitude: number;
  longitude: number;
  photoUrl: string | null;
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
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ready, setReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetInput, setSheetInput] = useState("");

  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);

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

  // Close dropdown on outside click (desktop only)
  useEffect(() => {
    if (isMobile) return;
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
  }, [isMobile]);

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!ready || input.length < 2) {
        setSuggestions([]);
        if (!isMobile) setIsOpen(false);
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

        const mapped: PlaceSuggestion[] = results
          .filter((s) => s.placePrediction)
          .map((s) => ({
            placeId: s.placePrediction!.placeId,
            mainText: s.placePrediction!.mainText?.text ?? "",
            secondaryText: s.placePrediction!.secondaryText?.text ?? "",
          }));

        setSuggestions(mapped);
        if (!isMobile) {
          setIsOpen(mapped.length > 0);
        }
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        if (!isMobile) setIsOpen(false);
      }
    },
    [ready, includedPrimaryTypes, isMobile]
  );

  function debouncedFetch(input: string) {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(input);
    }, 300);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    debouncedFetch(val);
  }

  function handleSheetInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSheetInput(val);
    onChange(val);
    debouncedFetch(val);
  }

  async function handleSelect(suggestion: PlaceSuggestion) {
    onChange(suggestion.mainText);
    setIsOpen(false);
    setSuggestions([]);

    if (isMobile) {
      setSheetOpen(false);
      setSheetInput("");
    }

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

  function handleMobileFocus() {
    setSheetInput(value);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      setSuggestions([]);
      setSheetInput("");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {isMobile ? (
        <>
          <Input
            id={id}
            value={value}
            onFocus={handleMobileFocus}
            readOnly
            placeholder={placeholder}
            required={required}
            autoComplete="off"
          />
          <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
            <SheetContent
              side="bottom"
              className="h-[70vh] rounded-t-xl"
              showCloseButton={false}
            >
              <SheetHeader className="pb-0">
                <SheetTitle>場所を検索</SheetTitle>
                <SheetDescription className="sr-only">
                  場所の名前を入力してください
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={sheetInputRef}
                    value={sheetInput}
                    onChange={handleSheetInputChange}
                    placeholder={placeholder}
                    autoComplete="off"
                    autoFocus
                    className="pl-9"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <PlaceSuggestionList
                    suggestions={suggestions}
                    activeIndex={activeIndex}
                    onSelect={handleSelect}
                  />
                  {sheetInput.length >= 2 && suggestions.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                      候補が見つかりません
                    </p>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <>
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
              <div className="max-h-60 overflow-y-auto">
                <PlaceSuggestionList
                  suggestions={suggestions}
                  activeIndex={activeIndex}
                  onSelect={handleSelect}
                  onHover={setActiveIndex}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
