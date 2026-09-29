// supabase/functions/notify-telegram-order-ready/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const providedSecret = req.headers.get("x-webhook-secret") ?? "";
    if (!WEBHOOK_SECRET || providedSecret !== WEBHOOK_SECRET) {
      return json({ error: "unauthorized" }, 401);
    }

    const payload = await req.json();
    const order = payload.record;
    if (!order) return json({ error: "no record in payload" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: table } = await admin
      .from("tables")
      .select("number, zone")
      .eq("id", order.table_id)
      .maybeSingle();

    const tableLabel = table ? `โซน ${table.zone} โต๊ะ ${table.number}` : "ไม่ทราบโต๊ะ";

    const text =
      `🍽️ ออเดอร์เสร็จแล้ว พร้อมเสิร์ฟ!\n` +
      `เลขออเดอร์: #${order.order_no}\n` +
      `${tableLabel}\n` +
      `รบกวนพนักงานไปรับไปเสิร์ฟด้วยครับ`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
      }
    );

    if (!tgRes.ok) {
      const errText = await tgRes.text();
      return json({ error: "telegram_failed", detail: errText }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});