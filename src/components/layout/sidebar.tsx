"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Map, Plane, Settings, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/trips", label: "旅行一覧", icon: Plane },
  { href: "/map", label: "訪問マップ", icon: Map },
  { href: "/settings", label: "設定", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
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
    </aside>
  );
}
