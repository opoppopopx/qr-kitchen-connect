import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ROLES = ["admin", "manager", "cashier", "kitchen", "waiter"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json();
    const action = body?.action;

    // One-time bootstrap: allowed only while no staff account exists at all.
    const { count: staffCount } = await admin
      .from("profiles").select("id", { count: "exact", head: true });
    const bootstrap = (staffCount ?? 0) === 0 && action === "create";

    let callerId = "";
    if (!bootstrap) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");
      if (!token) return json({ error: "unauthorized" }, 401);

      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
      callerId = userData.user.id;

      const { data: isBoss } = await admin.rpc("is_boss", { _user_id: callerId });
      if (!isBoss) return json({ error: "forbidden" }, 403);
    }


    if (action === "create") {
      const username = String(body.username ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const role = String(body.role ?? "");
      const full_name = String(body.full_name ?? "").trim();
      const phone = String(body.phone ?? "").trim();
      const salary = Number(body.salary ?? 0);

      if (!/^[a-z0-9._-]{3,32}$/.test(username)) return json({ error: "ชื่อผู้ใช้ไม่ถูกต้อง (a-z, 0-9, 3-32 ตัว)" }, 400);
      if (password.length < 6) return json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, 400);
      if (!ROLES.includes(role)) return json({ error: "ตำแหน่งไม่ถูกต้อง" }, 400);
      if (!Number.isFinite(salary) || salary < 0) return json({ error: "เงินเดือนไม่ถูกต้อง" }, 400);

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: `${username}@qrpos.local`,
        password,
        email_confirm: true,
      });
      if (createErr || !created.user) return json({ error: createErr?.message ?? "ไม่สามารถสร้างผู้ใช้ได้" }, 400);

      const uid = created.user.id;
      const { error: pErr } = await admin.from("profiles").insert({
        id: uid, username, full_name: full_name || username, phone, salary, active: true,
      });
      if (pErr) return json({ error: pErr.message }, 400);

      const { error: rErr } = await admin.from("user_roles").insert({ user_id: uid, role });
      if (rErr) return json({ error: rErr.message }, 400);

      return json({ ok: true, id: uid });
    }

    if (action === "set_role") {
      const userId = String(body.user_id ?? "");
      const role = String(body.role ?? "");
      if (!userId || !ROLES.includes(role)) return json({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
      await admin.from("user_roles").delete().eq("user_id", userId);
      const { error } = await admin.from("user_roles").insert({ user_id: userId, role });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_password") {
      const userId = String(body.user_id ?? "");
      const password = String(body.password ?? "");
      if (!userId || password.length < 6) return json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete") {
      const userId = String(body.user_id ?? "");
      if (!userId) return json({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
      if (userId === callerId) return json({ error: "ไม่สามารถลบบัญชีตัวเองได้" }, 400);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
