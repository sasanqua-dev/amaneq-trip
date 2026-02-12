"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Copy, Link2, Check, XCircle, Loader2 } from "lucide-react";
import { createShareLink, revokeShareLink } from "@/lib/actions/share";
import type { Database, MemberRole } from "@/lib/supabase/types";

type SharedTripRow = Database["public"]["Tables"]["shared_trips"]["Row"];

const permissionLabels: Record<string, string> = {
  viewer: "閲覧のみ",
  editor: "編集可能",
  owner: "オーナー",
};

interface SharePageClientProps {
  tripId: string;
  initialLinks: SharedTripRow[];
}

export function SharePageClient({ tripId, initialLinks }: SharePageClientProps) {
  const [permission, setPermission] = useState<MemberRole>("viewer");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeLinks = initialLinks.filter((link) => link.is_active);

  const handleCreate = () => {
    startTransition(async () => {
      await createShareLink(tripId, permission);
    });
  };

  const handleRevoke = (shareId: string) => {
    startTransition(async () => {
      await revokeShareLink(shareId);
    });
  };

  const handleCopy = async (token: string, shareId: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/trips/${tripId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">共有設定</h1>
      </div>

      {/* リンク生成カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            共有リンクを発行
          </CardTitle>
          <CardDescription>
            リンクを共有して、他の人に旅行の情報を公開できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">権限:</span>
            <Select
              value={permission}
              onValueChange={(v) => setPermission(v as MemberRole)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">閲覧のみ</SelectItem>
                <SelectItem value="editor">編集可能</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            共有リンクを生成
          </Button>
        </CardContent>
      </Card>

      {/* 既存リンク一覧 */}
      {activeLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">発行済みリンク</CardTitle>
            <CardDescription>
              {activeLinks.length} 件の有効なリンク
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeLinks.map((link) => {
              const url = `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${link.share_token}`;
              return (
                <div
                  key={link.id}
                  className="flex items-center gap-2 rounded-lg border p-3"
                >
                  <Input
                    value={url}
                    readOnly
                    className="font-mono text-xs flex-1"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {permissionLabels[link.permission]}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleCopy(link.share_token, link.id)}
                  >
                    {copiedId === link.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleRevoke(link.id)}
                    disabled={isPending}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
