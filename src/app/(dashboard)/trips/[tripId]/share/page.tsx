import { notFound } from "next/navigation";
import { ensureUser } from "@/lib/auth0";
import { getShareLinks, getTripMembers } from "@/lib/actions/share";
import { SharePageClient } from "./share-page-client";

interface SharePageProps {
  params: Promise<{ tripId: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { tripId } = await params;
  const user = await ensureUser();
  if (!user) return null;

  let shareLinks;
  let membersData;
  try {
    [shareLinks, membersData] = await Promise.all([
      getShareLinks(tripId),
      getTripMembers(tripId),
    ]);
  } catch {
    notFound();
  }

  return (
    <SharePageClient
      tripId={tripId}
      initialLinks={shareLinks}
      initialMembers={membersData.members}
      currentUserRole={membersData.currentUserRole}
    />
  );
}
