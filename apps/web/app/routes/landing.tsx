import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { MapPin, Calendar, Receipt, Share2 } from "lucide-react";
import { Button } from "~/components/ui/button";

const features = [
  {
    icon: Calendar,
    title: "スケジュール管理",
    description: "過去の振り返りも、未来の計画も。旅行の行程をまとめて管理。",
  },
  {
    icon: Receipt,
    title: "費用精算",
    description: "旅費を記録して、1人あたりの金額を自動計算。割り勘もかんたん。",
  },
  {
    icon: Share2,
    title: "共有",
    description: "旅行の日程を仲間に共有。一緒に計画を立てよう。",
  },
  {
    icon: MapPin,
    title: "訪問マップ",
    description: "どの都道府県にどれくらい訪れたか、ヒートマップで一目瞭然。",
  },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/trips");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">amaneq trip</h1>
          <Button
            onClick={() =>
              loginWithRedirect({
                appState: { returnTo: "/trips" },
              })
            }
          >
            ログイン
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            旅の計画と思い出を、
            <br />
            ひとつの場所に。
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            amaneq
            tripは、旅行のスケジュール管理・費用精算・訪問記録をまとめて管理できるアプリです。
          </p>
          <Button
            size="lg"
            className="text-lg"
            onClick={() =>
              loginWithRedirect({
                appState: { returnTo: "/trips" },
              })
            }
          >
            はじめる
          </Button>
        </section>

        <section className="border-t bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border bg-card p-6"
                >
                  <feature.icon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} amaneq trip
        </div>
      </footer>
    </div>
  );
}
