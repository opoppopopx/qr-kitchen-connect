import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { roleLabels, type AppRole, type StaffMember } from "@/types/restaurant";

const roleColors: Record<AppRole, string> = {
  admin: "bg-purple-100 text-purple-800",
  manager: "bg-amber-100 text-amber-800",
  cashier: "bg-blue-100 text-blue-800",
  kitchen: "bg-orange-100 text-orange-800",
  waiter: "bg-green-100 text-green-800",
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [salaryInput, setSalaryInput] = useState("");

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
      role: (roles ?? []).find(r => r.user_id === p.id)?.role ?? "waiter",
    })));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (s: StaffMember) => {
    const { error } = await supabase.from("profiles").update({ active: !s.active }).eq("id", s.id);
    if (error) toast.error("ไม่สามารถอัปเดตได้");
    await load();
  };

  const saveSalary = async (s: StaffMember) => {
    const value = Number(salaryInput);
    if (Number.isNaN(value)) { toast.error("กรุณากรอกตัวเลข"); return; }
    const { error } = await supabase.from("profiles").update({ salary: value }).eq("id", s.id);
    if (error) toast.error("ไม่สามารถบันทึกเงินเดือนได้");
    else toast.success("บันทึกเงินเดือนแล้ว");
    setEditing(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">จัดการพนักงาน</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(s => (
          <Card key={s.id} className={`transition-all ${!s.active ? "opacity-50" : ""}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {(s.full_name || s.username || "?")[0]}
                </div>
                <div>
                  <p className="font-semibold">{s.full_name || s.username}</p>
                  <p className="text-xs text-muted-foreground">{s.phone}</p>
                  <Badge className={`mt-1 ${roleColors[s.role]}`}>{roleLabels[s.role]}</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">เงินเดือน</span>
                {editing === s.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-8 w-24"
                      value={salaryInput}
                      onChange={e => setSalaryInput(e.target.value)}
                    />
                    <Button size="sm" onClick={() => saveSalary(s)}>บันทึก</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">฿{s.salary.toLocaleString()}</span>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(s.id); setSalaryInput(String(s.salary)); }}>
                      แก้ไข
                    </Button>
                  </div>
                )}
              </div>

              <Button
                size="sm"
                className="w-full"
                variant={s.active ? "outline" : "default"}
                onClick={() => toggleActive(s)}
              >
                {s.active ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
              </Button>
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
