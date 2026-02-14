import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // ランディングページ (公開)
  index("routes/landing.tsx"),

  // Auth0 コールバック
  route("callback", "routes/callback.tsx"),

  // ダッシュボード (認証必須)
  layout("routes/dashboard/layout.tsx", [
    route("trips", "routes/dashboard/trips.tsx"),
    route("trips/new", "routes/dashboard/trips-new.tsx"),
    route("trips/:tripId", "routes/dashboard/trip-detail.tsx"),
    route("trips/:tripId/edit", "routes/dashboard/trip-edit.tsx"),
    route("trips/:tripId/itinerary", "routes/dashboard/trip-itinerary.tsx"),
    route("trips/:tripId/expenses", "routes/dashboard/trip-expenses.tsx"),
    route("trips/:tripId/share", "routes/dashboard/trip-share.tsx"),
    route("map", "routes/dashboard/map.tsx"),
    route("settings", "routes/dashboard/settings.tsx"),
  ]),

  // 公開共有リンク
  route("shared/:token", "routes/shared.tsx"),
] satisfies RouteConfig;
