import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { user_id, title, body } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 対象ユーザーのトークンを取得
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", user_id);

  if (!tokens?.length) {
    return new Response(JSON.stringify({ error: "No tokens" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Expo Push API に送信
  const messages = tokens.map((t: { token: string }) => ({
    to: t.token,
    sound: "default",
    title,
    body,
  }));

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  return new Response(JSON.stringify(await res.json()), {
    headers: { "Content-Type": "application/json" },
  });
});
