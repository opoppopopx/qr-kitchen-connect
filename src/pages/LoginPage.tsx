import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { homeFor } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/restaurant";
import { BrandLogo } from "@/components/BrandLogo";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
      return;
    }
    setBusy(true);
    const { error } = await signIn(username, password);
    if (error) {
      toast.error(error);
      setBusy(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    let role: AppRole | null = null;
    if (user) {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).limit(1).maybeSingle();
      role = (data?.role as AppRole) ?? null;
    }
    toast.success("เข้าสู่ระบบสำเร็จ");
    navigate(homeFor(role), { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <BrandLogo size={56} withName={false} className="justify-center mb-2" />
          <CardTitle>TableOrder</CardTitle>
          <CardDescription>เข้าสู่ระบบสำหรับพนักงาน</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้งาน</Label>
              <Input id="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="เช่น admin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
