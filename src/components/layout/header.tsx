"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import { MobileNav } from "./mobile-nav";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <MobileNav />
        <Link href="/trips" className="text-lg font-bold">
          amaneq trip
        </Link>
      </div>
      <div className="hidden md:block" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.picture ?? undefined} alt={user?.name ?? ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              設定
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/auth/profile">
              <User className="mr-2 h-4 w-4" />
              プロフィール
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/auth/logout">
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
