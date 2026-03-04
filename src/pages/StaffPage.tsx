import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import type { StaffRole } from "@/types/restaurant";

const roleLabels: Record<StaffRole, string> = {
  admin: "ผู้จัดการ",
  cashier: "แคชเชียร์",
  kitchen: "พ่อครัว",
  waiter: "พนักงานเสิร์ฟ",
};

const roleColors: Record<StaffRole, string> = {
  admin: "bg-purple-100 text-purple-800",
  cashier: "bg-blue-100 text-blue-800",
  kitchen: "bg-orange-100 text-orange-800",
  waiter: "bg-green-100 text-green-800",
};

export default function StaffPage() {
  const { staff, addStaff, toggleStaffActive } = useRestaurant();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("waiter");

  const handleAdd = () => {
    if (!name.trim()) return;
    addStaff({ name: name.trim(), phone: phone.trim(), role, active: true });
    setName(""); setPhone(""); setRole("waiter");
    setOpen(false);
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
            <DialogHeader>
              <DialogTitle>เพิ่มพนักงานใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="ชื่อ-นามสกุล" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="เบอร์โทร" value={phone} onChange={e => setPhone(e.target.value)} />
              <Select value={role} onValueChange={v => setRole(v as StaffRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">ผู้จัดการ</SelectItem>
                  <SelectItem value="cashier">แคชเชียร์</SelectItem>
                  <SelectItem value="kitchen">พ่อครัว</SelectItem>
                  <SelectItem value="waiter">พนักงานเสิร์ฟ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd}>บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(s => (
          <Card key={s.id} className={`transition-all ${!s.active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {s.name[0]}
                </div>
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.phone}</p>
                  <Badge className={`mt-1 ${roleColors[s.role]}`}>{roleLabels[s.role]}</Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant={s.active ? "outline" : "default"}
                onClick={() => toggleStaffActive(s.id)}
              >
                {s.active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
