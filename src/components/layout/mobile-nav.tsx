"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Map, Plane, Settings, PlusCircle } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/trips", label: "旅行一覧", icon: Plane },
  { href: "/map", label: "訪問マップ", icon: Map },
  { href: "/settings", label: "設定", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">メニュー</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="flex h-16 items-center border-b px-6 text-lg font-bold">
          amaneq trip
        </SheetTitle>
        <div className="p-4">
          <Link href="/trips/new" onClick={() => setOpen(false)}>
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
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
