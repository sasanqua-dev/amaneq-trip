import { redirect } from "next/navigation";
import { auth0, ensureUser } from "@/lib/auth0";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type TripRow = Database["public"]["Tables"]["trips"]["Row"];
type TripMemberRow = Database["public"]["Tables"]["trip_members"]["Row"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login?returnTo=/trips");
  }

  const user = await ensureUser();

  // Fetch latest 20 trips for sidebar
  let recentTrips: TripRow[] = [];
  if (user) {
    const supabase = createServerClient();
    const { data: memberData } = await supabase
      .from("trip_members")
      .select()
      .eq("user_id", user.dbId);

    const tripIds = ((memberData ?? []) as TripMemberRow[]).map((m) => m.trip_id);

    if (tripIds.length > 0) {
      const { data: trips } = await supabase
        .from("trips")
        .select()
        .in("id", tripIds)
        .order("start_date", { ascending: false, nullsFirst: false })
        .limit(20);

      recentTrips = (trips ?? []) as TripRow[];
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar trips={recentTrips} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
