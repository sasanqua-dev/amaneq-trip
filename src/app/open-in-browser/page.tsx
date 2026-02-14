"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback, Suspense } from "react";
import { ExternalLink, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function OpenInBrowserContent() {
  const searchParams = useSearchParams();
  const appName = searchParams.get("app") ?? "アプリ";
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: 選択用のinputを使う
      const input = document.createElement("input");
      input.value = appUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [appUrl]);

  const openInExternalBrowser = useCallback(() => {
    // Android: Intent URL で既定のブラウザを起動
    const intentUrl = `intent://${appUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;end`;
    window.location.href = intentUrl;
  }, [appUrl]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">
            ブラウザで開いてください
          </CardTitle>
          <CardDescription>
            {appName}
            のアプリ内ブラウザでは、Googleログインが利用できません。Safari
            や Chrome などのブラウザで開き直してください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 手順 */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="mb-3 text-sm font-semibold">開き方</p>
            <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>
                画面右上の{" "}
                <span className="font-medium text-foreground">
                  「&#8942;」
                </span>{" "}
                や{" "}
                <span className="font-medium text-foreground">
                  「&#x2026;」
                </span>{" "}
                メニューをタップ
              </li>
              <li>
                <span className="font-medium text-foreground">
                  「ブラウザで開く」
                </span>
                や
                <span className="font-medium text-foreground">
                  「Safariで開く」
                </span>
                を選択
              </li>
            </ol>
          </div>

          {/* ボタン群 */}
          <div className="flex flex-col gap-2">
            <Button onClick={openInExternalBrowser} className="w-full">
              <ExternalLink className="h-4 w-4" />
              ブラウザで開く
            </Button>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="w-full"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "コピーしました" : "URLをコピー"}
            </Button>
          </div>

          {/* URL表示 */}
          <p className="break-all text-center text-xs text-muted-foreground">
            {appUrl}
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} amaneq trip
      </p>
    </div>
  );
}

export default function OpenInBrowserPage() {
  return (
    <Suspense>
      <OpenInBrowserContent />
    </Suspense>
  );
}
