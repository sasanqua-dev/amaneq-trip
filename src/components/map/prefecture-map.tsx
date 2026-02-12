"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { PREFECTURE_CENTERS } from "@/lib/constants/prefecture-centers";
import { getPrefectureByCode } from "@/lib/constants/prefectures";
import { getPrefectureSpots, type PrefectureSpot } from "@/lib/actions/map";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

// Fix default marker icon paths for Leaflet in Next.js
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface PrefectureMapProps {
  prefectureCode: number;
  onBack: () => void;
}

export function PrefectureMap({ prefectureCode, onBack }: PrefectureMapProps) {
  const [spots, setSpots] = useState<PrefectureSpot[]>([]);
  const [loading, setLoading] = useState(true);

  const center = PREFECTURE_CENTERS[prefectureCode];
  const prefecture = getPrefectureByCode(prefectureCode);

  useEffect(() => {
    setLoading(true);
    getPrefectureSpots(prefectureCode)
      .then(setSpots)
      .finally(() => setLoading(false));
  }, [prefectureCode]);

  if (!center || !prefecture) return null;

  const spotsWithCoords = spots.filter((s) => s.latitude && s.longitude);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {prefecture.name}の訪問スポット
        </h2>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      <div className="h-[500px] w-full overflow-hidden rounded-lg border">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={center.zoom}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {spotsWithCoords.map((spot) => (
            <Marker
              key={spot.id}
              position={[spot.latitude!, spot.longitude!]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{spot.title}</p>
                  {spot.locationName && (
                    <p className="text-gray-600">{spot.locationName}</p>
                  )}
                  <p className="text-gray-500 mt-1">
                    旅行: {spot.tripTitle}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {!loading && spotsWithCoords.length === 0 && (
        <p className="text-muted-foreground text-sm">
          この都道府県には座標が登録されたスポットがありません。
          スポット追加時に緯度・経度を入力すると、ここにピンが表示されます。
        </p>
      )}

      {!loading && spotsWithCoords.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {spotsWithCoords.length}件のスポットが見つかりました
        </div>
      )}
    </div>
  );
}
