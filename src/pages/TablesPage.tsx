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
  const { tables, categories, products, orders, openTable, closeTable, setTableStatus, createOrder } = useRestaurant();
  const [orderTable, setOrderTable] = useState<RestaurantTable | null>(null);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [busy, setBusy] = useState(false);

  const zones = [...new Set(tables.map(t => t.zone))].sort();

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
      <h2 className="text-2xl font-bold">โต๊ะอาหาร</h2>

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
    </div>
  );
}
