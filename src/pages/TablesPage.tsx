import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { QrCode, Send, Plus, Trash2 } from "lucide-react";
import { MenuPicker } from "@/components/MenuPicker";
import type { CartItem, RestaurantTable } from "@/types/restaurant";
import { tableOrderUrl } from "@/lib/publicUrl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'ว่าง', color: 'bg-green-100 text-green-800 border-green-300' },
  occupied: { label: 'เปิดอยู่', color: 'bg-primary/10 text-primary border-primary/30' },
  reserved: { label: 'จอง', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
};

export default function TablesPage() {
  const { tables, categories, products, orders, openTable, closeTable, setTableStatus, createOrder, addTable, deleteTable } = useRestaurant();
  const { role } = useAuth();
  const canManage = role === 'admin' || role === 'manager';
  const [orderTable, setOrderTable] = useState<RestaurantTable | null>(null);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ number: "", zone: "A", seats: "4" });
  const [delTable, setDelTable] = useState<RestaurantTable | null>(null);

  const zones = [...new Set(tables.map(t => t.zone))].sort();

  const submitNewTable = async () => {
    const number = parseInt(form.number, 10);
    const seats = parseInt(form.seats, 10);
    const zone = form.zone.trim().toUpperCase();
    if (!number || number <= 0) { toast.error("กรุณากรอกเลขโต๊ะให้ถูกต้อง"); return; }
    if (!zone) { toast.error("กรุณากรอกโซน"); return; }
    if (!seats || seats <= 0) { toast.error("กรุณากรอกจำนวนที่นั่ง"); return; }
    if (tables.some(t => t.number === number)) { toast.error(`มีโต๊ะหมายเลข ${number} อยู่แล้ว`); return; }
    setBusy(true);
    const err = await addTable({ number, zone, seats });
    setBusy(false);
    if (err) { toast.error("เพิ่มโต๊ะไม่สำเร็จ: " + err); return; }
    toast.success(`เพิ่มโต๊ะ ${number} (โซน ${zone}) แล้ว`);
    setAddOpen(false);
    setForm({ number: "", zone, seats: "4" });
  };

  const confirmDelete = async () => {
    if (!delTable) return;
    setBusy(true);
    const err = await deleteTable(delTable.id);
    setBusy(false);
    if (err) {
      toast.error("ลบโต๊ะไม่สำเร็จ — อาจมีออร์เดอร์หรือการจองผูกอยู่กับโต๊ะนี้");
      return;
    }
    toast.success(`ลบโต๊ะ ${delTable.number} แล้ว`);
    setDelTable(null);
  };

  const startOrder = async (table: RestaurantTable) => {
    if (table.status !== 'occupied') await openTable(table.id);
    setCart([]);
    setOrderTable(table);
  };

  const submit = async () => {
    if (!orderTable || cart.length === 0) {
      toast.error("กรุณาเลือกรายการอาหาร");
      return;
    }
    setBusy(true);
    const id = await createOrder(orderTable.id, cart, 'staff');
    setBusy(false);
    if (!id) {
      toast.error("ส่งออร์เดอร์ไม่สำเร็จ");
      return;
    }
    toast.success(`ส่งออร์เดอร์โต๊ะ ${orderTable.number} ไปที่ครัวแล้ว 🍳`);
    setCart([]);
    setOrderTable(null);
  };

  const qrUrl = qrTable ? tableOrderUrl(qrTable.id) : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">โต๊ะอาหาร</h2>
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> เพิ่มโต๊ะ
          </Button>
        )}
      </div>


      {zones.map(zone => (
        <div key={zone}>
          <h3 className="text-lg font-semibold mb-3">โซน {zone}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tables.filter(t => t.zone === zone).map(table => {
              const config = statusConfig[table.status];
              const activeOrders = orders.filter(o => o.table_id === table.id && ['pending', 'preparing', 'ready'].includes(o.status));
              return (
                <Card key={table.id} className={`transition-all hover:shadow-md ${table.status === 'occupied' ? 'ring-2 ring-primary/30' : ''}`}>
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="text-3xl font-bold">{table.number}</div>
                    <Badge className={config.color}>{config.label}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {table.seats} ที่นั่ง{activeOrders.length ? ` • ${activeOrders.length} ออร์เดอร์` : ""}
                    </p>
                    <div className="space-y-1">
                      <Button size="sm" className="w-full" onClick={() => startOrder(table)}>
                        <Send className="h-3 w-3 mr-1" /> สั่งอาหาร
                      </Button>
                      {table.status === 'available' ? (
                        <div className="grid grid-cols-2 gap-1">
                          <Button size="sm" variant="outline" onClick={() => openTable(table.id)}>เปิด</Button>
                          <Button size="sm" variant="secondary" onClick={() => setTableStatus(table.id, 'reserved')}>จอง</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => closeTable(table.id)}>
                          {table.status === 'reserved' ? 'ยกเลิกการจอง' : 'ปิดโต๊ะ'}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="w-full" onClick={() => setQrTable(table)}>
                        <QrCode className="h-3 w-3 mr-1" /> QR โต๊ะ
                      </Button>
                      {canManage && (
                        <Button size="sm" variant="ghost" className="w-full text-destructive hover:bg-destructive/10" onClick={() => setDelTable(table)}>
                          <Trash2 className="h-3 w-3 mr-1" /> ลบโต๊ะ
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Order dialog */}
      <Dialog open={!!orderTable} onOpenChange={o => !o && setOrderTable(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สั่งอาหาร — โต๊ะ {orderTable?.number}</DialogTitle>
            <DialogDescription>เลือกเมนูและระบุคำขอพิเศษ แล้วส่งไปที่ครัวและออร์เดอร์</DialogDescription>
          </DialogHeader>
          <MenuPicker categories={categories} products={products} cart={cart} setCart={setCart} />
          <DialogFooter>
            <Button onClick={submit} disabled={busy || cart.length === 0}>
              <Send className="h-4 w-4 mr-2" /> ส่งไปที่ครัว
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR dialog */}
      <Dialog open={!!qrTable} onOpenChange={o => !o && setQrTable(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">QR โต๊ะ {qrTable?.number}</DialogTitle>
            <DialogDescription className="text-center">ลูกค้าสแกนด้วยมือถือเพื่อสั่งอาหารที่โต๊ะนี้</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            {qrUrl && <QRCodeSVG value={qrUrl} size={200} includeMargin />}
            <p className="text-xs break-all text-center text-muted-foreground">{qrUrl}</p>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(qrUrl); toast.success("คัดลอกลิงก์แล้ว"); }}>
              คัดลอกลิงก์
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add table dialog (admin/manager) */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>เพิ่มโต๊ะใหม่</DialogTitle>
            <DialogDescription>ระบุเลขโต๊ะ โซน และจำนวนที่นั่ง</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="t-number">เลขโต๊ะ</Label>
              <Input id="t-number" type="number" min={1} value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="เช่น 19" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-zone">โซน</Label>
              <Input id="t-zone" value={form.zone}
                onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} placeholder="A" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-seats">จำนวนที่นั่ง</Label>
              <Input id="t-seats" type="number" min={1} value={form.seats}
                onChange={e => setForm(f => ({ ...f, seats: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitNewTable} disabled={busy}>
              <Plus className="h-4 w-4 mr-1" /> เพิ่มโต๊ะ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!delTable} onOpenChange={o => !o && setDelTable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบโต๊ะ {delTable?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              ลบแล้วกู้คืนไม่ได้ และ QR ของโต๊ะนี้จะใช้งานไม่ได้อีก
              (ถ้าโต๊ะนี้มีออร์เดอร์หรือการจองอยู่ในระบบจะลบไม่ได้)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบโต๊ะ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
