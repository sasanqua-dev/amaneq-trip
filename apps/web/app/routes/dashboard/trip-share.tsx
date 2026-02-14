import { Link, useParams } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
import { useSupabase } from "~/lib/supabase";
import { useAppUser } from "~/lib/auth";
import {
  createShareLink,
  getShareLinks,
  deactivateShareLink,
  getTripMembers,
  checkMembership,
  addTripMember,
  getUserByEmail,
  removeTripMember,
} from "@amaneq/core";
import type { MemberRole } from "@amaneq/core";

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

interface MemberDisplay {
  id: string;
  role: MemberRole;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ShareLinkDisplay {
  id: string;
  shareToken: string;
  permission: string;
  isActive: boolean;
}

export default function TripSharePage() {
  const { tripId } = useParams();
  const client = useSupabase();
  const { dbUserId } = useAppUser();

  const [members, setMembers] = useState<MemberDisplay[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLinkDisplay[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole>("viewer");
  const [loading, setLoading] = useState(true);

  const [permission, setPermission] = useState<MemberRole>("viewer");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("editor");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviting, setInviting] = useState(false);

  const loadData = useCallback(async () => {
    if (!tripId || !dbUserId) return;

    const [membersResult, linksResult, membershipResult] = await Promise.all([
      getTripMembers(client, tripId),
      getShareLinks(client, tripId),
      checkMembership(client, tripId, dbUserId),
    ]);

    const rawMembers = (membersResult.data ?? []) as Array<{
      id: string;
      role: string;
      users: { email: string; display_name: string | null; avatar_url: string | null } | null;
    }>;

    setMembers(
      rawMembers.map((m) => {
        const u = Array.isArray(m.users) ? m.users[0] : m.users;
        return {
          id: m.id,
          role: m.role as MemberRole,
          email: u?.email ?? "",
          displayName: u?.display_name ?? null,
          avatarUrl: u?.avatar_url ?? null,
        };
      })
    );

    const rawLinks = (linksResult.data ?? []) as Array<{
      id: string;
      share_token: string;
      permission: string;
      is_active: boolean;
    }>;
    setShareLinks(
      rawLinks.map((l) => ({
        id: l.id,
        shareToken: l.share_token,
        permission: l.permission,
        isActive: l.is_active,
      }))
    );

    if (membershipResult.data) {
      setCurrentUserRole((membershipResult.data as { role: string }).role as MemberRole);
    }

    setLoading(false);
  }, [tripId, dbUserId, client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!tripId) return;
    setCreating(true);
    await createShareLink(client, tripId, permission);
    await loadData();
    setCreating(false);
  };

  const handleRevoke = async (shareId: string) => {
    await deactivateShareLink(client, shareId);
    await loadData();
  };

  const handleCopy = async (token: string, shareId: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInvite = async () => {
    if (!tripId) return;
    setInviteError(null);
    setInviteSuccess(false);
    setInviting(true);

    const { data: targetUser } = await getUserByEmail(client, inviteEmail.trim());
    if (!targetUser) {
      setInviteError("このメールアドレスのユーザーは登録されていません");
      setInviting(false);
      return;
    }

    const { data: existing } = await checkMembership(client, tripId, targetUser.id);
    if (existing) {
      setInviteError("このユーザーは既に参加しています");
      setInviting(false);
      return;
    }

    const { error } = await addTripMember(client, tripId, targetUser.id, inviteRole);
    if (error) {
      setInviteError(`招待に失敗しました: ${error.message}`);
    } else {
      setInviteSuccess(true);
      setInviteEmail("");
      await loadData();
      setTimeout(() => setInviteSuccess(false), 3000);
    }
    setInviting(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeTripMember(client, memberId);
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isOwner = currentUserRole === "owner";
  const canInvite = currentUserRole === "owner" || currentUserRole === "editor";
  const activeLinks = shareLinks.filter((l) => l.isActive);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/trips/${tripId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">共有設定</h1>
      </div>

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
              disabled={inviting || !inviteEmail.trim()}
            >
              {inviting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              招待する
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            メンバー
          </CardTitle>
          <CardDescription>
            {members.length} 人が参加中
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => {
            const name = member.displayName ?? member.email;
            const initials = name.slice(0, 2).toUpperCase();
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {initials}
                </div>
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
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

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
          <Button className="w-full" onClick={handleCreate} disabled={creating}>
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            共有リンクを生成
          </Button>
        </CardContent>
      </Card>

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
              const url = `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${link.shareToken}`;
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
                    onClick={() => handleCopy(link.shareToken, link.id)}
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
