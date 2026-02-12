"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  ArrowLeft,
  Copy,
  Link2,
  Check,
  XCircle,
  Loader2,
  Mail,
  Users,
  Trash2,
} from "lucide-react";
import {
  createShareLink,
  revokeShareLink,
  inviteMemberByEmail,
  removeTripMember,
} from "@/lib/actions/share";
import type { TripMemberWithUser } from "@/lib/actions/share";
import type { Database, MemberRole } from "@/lib/supabase/types";

type SharedTripRow = Database["public"]["Tables"]["shared_trips"]["Row"];

const permissionLabels: Record<string, string> = {
  viewer: "閲覧のみ",
  editor: "編集可能",
  owner: "オーナー",
};

const roleVariants: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  editor: "secondary",
  viewer: "outline",
};

interface SharePageClientProps {
  tripId: string;
  initialLinks: SharedTripRow[];
  initialMembers: TripMemberWithUser[];
  currentUserRole: MemberRole;
}

export function SharePageClient({
  tripId,
  initialLinks,
  initialMembers,
  currentUserRole,
}: SharePageClientProps) {
  const [permission, setPermission] = useState<MemberRole>("viewer");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("editor");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const activeLinks = initialLinks.filter((link) => link.is_active);
  const isOwner = currentUserRole === "owner";
  const canInvite = currentUserRole === "owner" || currentUserRole === "editor";

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

  const handleInvite = () => {
    setInviteError(null);
    setInviteSuccess(false);
    startTransition(async () => {
      const result = await inviteMemberByEmail(tripId, inviteEmail.trim(), inviteRole);
      if (result.error) {
        setInviteError(result.error);
      } else {
        setInviteSuccess(true);
        setInviteEmail("");
        setTimeout(() => setInviteSuccess(false), 3000);
      }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    startTransition(async () => {
      const result = await removeTripMember(tripId, memberId);
      if (result.error) {
        alert(result.error);
      }
    });
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

      {/* メール招待カード */}
      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              メールで招待
            </CardTitle>
            <CardDescription>
              メールアドレスを入力して、登録済みのユーザーを招待できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="example@email.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                  setInviteSuccess(false);
                }}
                className="flex-1"
              />
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as MemberRole)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">編集可能</SelectItem>
                  <SelectItem value="viewer">閲覧のみ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError && (
              <p className="text-sm text-destructive">{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="text-sm text-green-600">招待しました</p>
            )}
            <Button
              className="w-full"
              onClick={handleInvite}
              disabled={isPending || !inviteEmail.trim()}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              招待する
            </Button>
          </CardContent>
        </Card>
      )}

      {/* メンバー一覧カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            メンバー
          </CardTitle>
          <CardDescription>
            {initialMembers.length} 人が参加中
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {initialMembers.map((member) => {
            const name = member.displayName ?? member.email;
            const initials = (member.displayName ?? member.email).slice(0, 2).toUpperCase();
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Avatar size="sm">
                  {member.avatarUrl ? (
                    <AvatarImage src={member.avatarUrl} alt={name} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  {member.displayName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  )}
                </div>
                <Badge variant={roleVariants[member.role]}>
                  {permissionLabels[member.role]}
                </Badge>
                {isOwner && member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

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
