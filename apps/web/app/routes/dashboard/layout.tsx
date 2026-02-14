import { useAuth0 } from "@auth0/auth0-react";
import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import {
  Map,
  Settings,
  LogOut,
  Plane,
  Menu,
  Plus,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { useAppUser } from "~/lib/auth";
import { useSupabase } from "~/lib/supabase";
import { getTrips } from "@amaneq/core";

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } =
    useAuth0();
  const navigate = useNavigate();
  const location = useLocation();
  const { dbUserId } = useAppUser();
  const client = useSupabase();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentTrips, setRecentTrips] = useState<
    Array<{ id: string; title: string }>
  >([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: location.pathname },
      });
    }
  }, [isAuthenticated, isLoading, loginWithRedirect, location.pathname]);

  useEffect(() => {
    if (!dbUserId) return;

    getTrips(client).then(({ data }) => {
      if (data) {
        setRecentTrips(
          data.slice(0, 20).map((t) => ({ id: t.id, title: t.title }))
        );
      }
    });
  }, [dbUserId, client]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const navItems = [
    { to: "/trips", label: "旅行", icon: Plane },
    { to: "/map", label: "マップ", icon: Map },
    { to: "/settings", label: "設定", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <Link to="/trips" className="text-lg font-bold">
          amaneq trip
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                location.pathname === item.to
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </div>

        {recentTrips.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                最近の旅行
              </h3>
              <Link to="/trips/new" onClick={() => setSidebarOpen(false)}>
                <Button variant="ghost" size="icon-xs">
                  <Plus className="size-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-1">
              {recentTrips.map((trip) => (
                <Link
                  key={trip.id}
                  to={`/trips/${trip.id}`}
                  className={`block truncate rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent ${
                    location.pathname === `/trips/${trip.id}`
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {trip.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r md:block">
        {sidebarContent}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                {sidebarContent}
              </SheetContent>
            </Sheet>
            <span className="text-lg font-semibold md:hidden">amaneq trip</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="size-7">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm">
                  {user?.name ?? user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="size-4" />
                設定
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
              >
                <LogOut className="size-4" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
