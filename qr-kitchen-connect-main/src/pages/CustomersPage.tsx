import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { UserPlus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function CustomersPage() {
  const { customers, orders, addCustomer, deleteCustomer } = useRestaurant();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const filtered = customers.filter(c =>
    [c.name, c.phone, c.email].some(v => v.toLowerCase().includes(q.trim().toLowerCase())));

  const save = async () => {
    if (!form.name.trim()) { toast.error("กรุณากรอกชื่อลูกค้า"); return; }
    await addCustomer({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() });
    toast.success("เพิ่มสมาชิกแล้ว");
    setForm({ name: "", phone: "", email: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-bold">ลูกค้าสมาชิก</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-48" placeholder="ค้นหาสมาชิก" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" /> สมัครสมาชิก</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>สมัครสมาชิกใหม่</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>ชื่อ-นามสกุล</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>เบอร์โทร</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="space-y-1"><Label>อีเมล</Label>
                  <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <DialogFooter><Button onClick={save}>บันทึก</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          const count = orders.filter(o => o.customer_id === c.id).length;
          return (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.phone || "-"} • {c.email || "-"}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary">แต้ม {c.points}</Badge>
                      <Badge variant="outline">{count} ออร์เดอร์</Badge>
                    </div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCustomer(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">ยังไม่มีลูกค้าสมาชิก</p>
        )}
      </div>
    </div>
  );
}
