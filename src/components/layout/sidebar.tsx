"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Map, Plane, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/types";

type TripRow = Database["public"]["Tables"]["trips"]["Row"];

const navItems = [
  { href: "/trips", label: "旅行一覧", icon: Plane },
  { href: "/map", label: "訪問マップ", icon: Map },
];

interface SidebarProps {
  trips: TripRow[];
}

export function Sidebar({ trips }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/trips" className="text-lg font-bold">
          amaneq trip
        </Link>
      </div>
      <div className="p-4">
        <Link href="/trips/new">
          <Button className="w-full" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            新しい旅行
          </Button>
        </Link>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      {trips.length > 0 && (
        <>
          <div className="px-6 pt-4 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              最近の旅行
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <div className="space-y-0.5">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className={cn(
                    "block rounded-md px-3 py-1.5 transition-colors truncate",
                    pathname === `/trips/${trip.id}`
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                  title={trip.title}
                >
                  {trip.start_date && (
                    <span className="block text-[10px] leading-tight text-sidebar-foreground/50">
                      {trip.start_date}
                    </span>
                  )}
                  <span className="block text-sm truncate">{trip.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
