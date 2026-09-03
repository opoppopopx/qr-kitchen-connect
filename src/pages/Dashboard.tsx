import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, ShoppingCart, UtensilsCrossed, Clock, CalendarRange, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { orderStatusLabels } from "@/types/restaurant";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  preparing: "bg-blue-100 text-blue-800 border-blue-300",
  ready: "bg-green-100 text-green-800 border-green-300",
  served: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const playBeep = () => {
  try {
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.2].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.2);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* ignore audio errors */
  }
};

export default function Dashboard() {
  const {
    orders, tables, todaySales, todayOrderCount, todayItemCount,
    yearSales, yearOrderCount, getProductById, getTableById, onNewOrder,
  } = useRestaurant();
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  useEffect(() => {
    const off = onNewOrder(({ tableId }) => {
      const table = tables.find(t => t.id === tableId);
      toast.success(`ออร์เดอร์ใหม่จากโต๊ะ ${table?.number ?? "-"} 🔔`);
      if (soundRef.current) playBeep();
    });
    return off;
  }, [onNewOrder, tables]);

  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">แดชบอร์ด</h2>
        <Button size="sm" variant="outline" onClick={() => setSoundOn(v => !v)}>
          {soundOn ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
          {soundOn ? "เสียงแจ้งเตือน: เปิด" : "เสียงแจ้งเตือน: ปิด"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ยอดขายวันนี้</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">฿{todaySales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{todayItemCount} รายการอาหาร</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ยอดขายปีนี้</CardTitle>
            <CalendarRange className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">฿{yearSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{yearOrderCount} ออร์เดอร์</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ออร์เดอร์วันนี้</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrderCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">โต๊ะที่เปิดอยู่</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedTables}/{tables.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ออร์เดอร์ค้างอยู่</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{pendingOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table overview */}
      <Card>
        <CardHeader><CardTitle>ภาพรวมโต๊ะอาหาร</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2">
            {tables.map(t => (
              <div
                key={t.id}
                className={`rounded-lg border p-2 text-center text-sm ${
                  t.status === 'occupied' ? 'bg-primary/10 border-primary/40 text-primary'
                  : t.status === 'reserved' ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                  : 'bg-muted'
                }`}
              >
                <div className="font-bold">{t.number}</div>
                <div className="text-[10px]">
                  {t.status === 'occupied' ? 'เปิดอยู่' : t.status === 'reserved' ? 'จอง' : 'ว่าง'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader><CardTitle>ออร์เดอร์ล่าสุด</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 10).map(order => {
              const table = getTableById(order.table_id);
              return (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {table?.number}
                    </div>
                    <div>
                      <p className="font-medium">โต๊ะ {table?.number} • {order.items.length} รายการ</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.map(i => getProductById(i.product_id)?.name).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">฿{Number(order.total_amount).toLocaleString()}</span>
                    <Badge className={statusColors[order.status]}>{orderStatusLabels[order.status]}</Badge>
                  </div>
                </div>
              );
            })}
            {orders.length === 0 && (
              <p className="text-center text-muted-foreground py-8">ยังไม่มีออร์เดอร์</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
