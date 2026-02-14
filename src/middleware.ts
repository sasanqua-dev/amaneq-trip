import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";
import { detectInAppBrowser } from "@/lib/in-app-browser";

export async function middleware(request: NextRequest) {
  // アプリ内ブラウザから /auth/login へのアクセスをブロック
  if (request.nextUrl.pathname.startsWith("/auth/login")) {
    const ua = request.headers.get("user-agent") ?? "";
    const { isInAppBrowser, appName } = detectInAppBrowser(ua);

    if (isInAppBrowser) {
      const url = request.nextUrl.clone();
      url.pathname = "/open-in-browser";
      url.search = appName ? `?app=${encodeURIComponent(appName)}` : "";
      return NextResponse.redirect(url);
    }
  }

  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json).*)",
  ],
};
