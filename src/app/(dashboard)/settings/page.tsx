import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
          <CardDescription>
            表示名やプロフィール情報を変更できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">表示名</Label>
            <Input id="displayName" placeholder="表示名を入力" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" disabled placeholder="Auth0で管理" />
          </div>
          <Button>保存</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>アカウント</CardTitle>
          <CardDescription>アカウントに関する設定です。</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/auth/logout">
            <Button variant="outline">ログアウト</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
