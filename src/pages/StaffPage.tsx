import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Trash2, KeyRound } from "lucide-react";
import { roleLabels, type AppRole, type StaffMember } from "@/types/restaurant";
import { useAuth } from "@/contexts/AuthContext";

const roleColors: Record<AppRole, string> = {
  admin: "bg-purple-100 text-purple-800",
  manager: "bg-amber-100 text-amber-800",
  cashier: "bg-blue-100 text-blue-800",
  kitchen: "bg-orange-100 text-orange-800",
  waiter: "bg-green-100 text-green-800",
};

const ROLES: AppRole[] = ["admin", "manager", "cashier", "kitchen", "waiter"];

const callStaffFn = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("manage-staff", { body });
  if (error) return { error: error.message };
  if (data?.error) return { error: String(data.error) };
  return { error: null };
};

export default function StaffPage() {
  const { user, role: myRole } = useAuth();
  const isAdmin = myRole === "admin";
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", full_name: "", phone: "", salary: "", role: "waiter" as AppRole });
  const [salaryEdit, setSalaryEdit] = useState<string | null>(null);
  const [salaryInput, setSalaryInput] = useState("");
  const [pwTarget, setPwTarget] = useState<StaffMember | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwValue2, setPwValue2] = useState("");

  const load = useCallback(async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      supabase.from("user_roles").select("*"),
    ]);
    setStaff((profiles ?? []).map(p => ({
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      phone: p.phone,
      salary: Number(p.salary),
      active: p.active,
      role: ((roles ?? []).find(r => r.user_id === p.id)?.role ?? "waiter") as AppRole,
    })));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addStaff = async () => {
    setBusy(true);
    const { error } = await callStaffFn({
      action: "create",
      username: form.username,
      password: form.password,
      full_name: form.full_name,
      phone: form.phone,
      salary: Number(form.salary || 0),
      role: form.role,
    });
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success("เพิ่มพนักงานแล้ว");
    setForm({ username: "", password: "", full_name: "", phone: "", salary: "", role: "waiter" });
    setOpen(false);
    await load();
  };

  const changeRole = async (s: StaffMember, role: AppRole) => {
    const { error } = await callStaffFn({ action: "set_role", user_id: s.id, role });
    if (error) toast.error(error); else toast.success("เปลี่ยนตำแหน่งแล้ว");
    await load();
  };

  const resetPassword = async () => {
    if (!pwTarget) return;
    if (pwValue.length < 6) { toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    if (pwValue !== pwValue2) { toast.error("รหัสผ่านยืนยันไม่ตรงกัน"); return; }
    setBusy(true);
    const { error } = await callStaffFn({ action: "set_password", user_id: pwTarget.id, password: pwValue });
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success(`เปลี่ยนรหัสผ่านของ @${pwTarget.username} แล้ว`);
    setPwTarget(null); setPwValue(""); setPwValue2("");
  };


  const removeStaff = async (s: StaffMember) => {
    if (!window.confirm(`ลบพนักงาน ${s.full_name || s.username}?`)) return;
    const { error } = await callStaffFn({ action: "delete", user_id: s.id });
    if (error) toast.error(error); else toast.success("ลบพนักงานแล้ว");
    await load();
  };

  const toggleActive = async (s: StaffMember) => {
    const { error } = await supabase.from("profiles").update({ active: !s.active }).eq("id", s.id);
    if (error) toast.error("ไม่สามารถอัปเดตได้");
    await load();
  };

  const saveSalary = async (s: StaffMember) => {
    const value = Number(salaryInput);
    if (!Number.isFinite(value) || value < 0) { toast.error("เงินเดือนไม่ถูกต้อง"); return; }
    const { error } = await supabase.from("profiles").update({ salary: value }).eq("id", s.id);
    if (error) toast.error("บันทึกเงินเดือนไม่สำเร็จ"); else toast.success("บันทึกเงินเดือนแล้ว");
    setSalaryEdit(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">จัดการพนักงาน</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" /> เพิ่มพนักงาน</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>เพิ่มพนักงานใหม่</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>ชื่อผู้ใช้งาน</Label>
                  <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="a-z, 0-9" /></div>
                <div className="space-y-1"><Label>รหัสผ่าน</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>ชื่อ-นามสกุล</Label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>เบอร์โทร</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="space-y-1"><Label>เงินเดือน (บาท)</Label>
                  <Input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>ตำแหน่ง</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as AppRole }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={addStaff} disabled={busy}>บันทึก</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(s => (
          <Card key={s.id} className={`transition-all ${!s.active ? "opacity-60" : ""}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {(s.full_name || s.username || "?")[0]}
                </div>
                <div>
                  <p className="font-semibold">{s.full_name || s.username}</p>
                  <p className="text-xs text-muted-foreground">@{s.username} • {s.phone || "-"}</p>
                  <Badge className={`mt-1 ${roleColors[s.role]}`}>{roleLabels[s.role]}</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">เงินเดือน</span>
                {salaryEdit === s.id ? (
                  <div className="flex items-center gap-2">
                    <Input className="h-8 w-24" type="number" value={salaryInput} onChange={e => setSalaryInput(e.target.value)} />
                    <Button size="sm" onClick={() => saveSalary(s)}>บันทึก</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">฿{s.salary.toLocaleString()}</span>
                    <Button size="sm" variant="outline" onClick={() => { setSalaryEdit(s.id); setSalaryInput(String(s.salary)); }}>แก้ไข</Button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ตำแหน่ง</Label>
                <Select value={s.role} onValueChange={v => changeRole(s, v as AppRole)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-1">
                <Button size="sm" variant={s.active ? "outline" : "default"} className="flex-1" onClick={() => toggleActive(s)}>
                  {s.active ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                </Button>
                {isAdmin && (
                  <Button size="icon" variant="outline" className="h-9 w-9" title="เปลี่ยนรหัสผ่าน"
                    onClick={() => { setPwTarget(s); setPwValue(""); setPwValue2(""); }}>
                    <KeyRound className="h-4 w-4" />
                  </Button>
                )}
                {s.id !== user?.id && (
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => removeStaff(s)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {staff.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">ยังไม่มีพนักงานในระบบ</p>
        )}
      </div>
    </div>
  );
}
