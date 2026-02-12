import { getUserVisitData } from "@/lib/actions/map";
import { MapView } from "@/components/map/map-view";

export default async function MapPage() {
  const visitCounts = await getUserVisitData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">訪問マップ</h1>
      <MapView visitCounts={visitCounts} />
    </div>
  );
}
