import { TripForm } from "@/components/trips/trip-form";

export default function NewTripPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">新しい旅行を作成</h1>
      <TripForm />
    </div>
  );
}
