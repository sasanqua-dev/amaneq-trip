"use client";

import { MapPin } from "lucide-react";

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceSuggestionListProps {
  suggestions: PlaceSuggestion[];
  activeIndex: number;
  onSelect: (suggestion: PlaceSuggestion) => void;
  onHover?: (index: number) => void;
}

export function PlaceSuggestionList({
  suggestions,
  activeIndex,
  onSelect,
  onHover,
}: PlaceSuggestionListProps) {
  if (suggestions.length === 0) return null;

  return (
    <ul className="py-1">
      {suggestions.map((suggestion, index) => (
        <li key={suggestion.placeId}>
          <button
            type="button"
            className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
              index === activeIndex ? "bg-accent" : ""
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(suggestion);
            }}
            onMouseEnter={() => onHover?.(index)}
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="truncate font-medium">{suggestion.mainText}</div>
              <div className="truncate text-xs text-muted-foreground">
                {suggestion.secondaryText}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
