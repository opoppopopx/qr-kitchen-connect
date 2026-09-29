import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, ShoppingCart, UtensilsCrossed, Clock, CalendarIcon, Receipt,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { orderStatusLabels } from "@/types/restaurant";
import { SoundToggle } from "@/components/SoundToggle";
import { playSound } from "@/lib/sound";
import {
  startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths,
  startOfYear, format, isWithinInterval,
} from "date-fns";
import { th } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  preparing: "bg-blue-100 text-blue-800 border-blue-300",
  ready: "bg-green-100 text-green-800 border-green-300",
  served: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

type Preset = "today" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

const presetLabels: Record<Preset, string> = {
  today: "วันนี้",
  thisMonth: "เดือนนี้",
  lastMonth: "เดือนที่แล้ว",
  thisYear: "ปีนี้",
  custom: "กำหนดเอง",
};

export default function Dashboard() {
  const { orders, tables, getProductById, getTableById, onNewOrder } = useRestaurant();

  useEffect(() => {
    const off = onNewOrder(({ tableId }) => {
      const table = tables.find(t => t.id === tableId);
      toast.success(`ออร์เดอร์ใหม่จากโต๊ะ ${table?.number ?? "-"} 🔔`);
      playSound("newOrder");
    });
    return off;
  }, [onNewOrder, tables]);

  const [preset, setPreset] = useState<Preset>("today");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case "today":
        return { rangeStart: startOfDay(now), rangeEnd: endOfDay(now) };
      case "thisMonth":
        return { rangeStart: startOfMonth(now), rangeEnd: endOfDay(now) };
      case "lastMonth": {
        const last = subMonths(now, 1);
        return { rangeStart: startOfMonth(last), rangeEnd: endOfMonth(last) };
      }
      case "thisYear":
        return { rangeStart: startOfYear(now), rangeEnd: endOfDay(now) };
      case "custom":
      default: {
        const from = customRange?.from ?? now;
        const to = customRange?.to ?? customRange?.from ?? now;
        return { rangeStart: startOfDay(from), rangeEnd: endOfDay(to) };
      }
    }
  }, [preset, customRange]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => o.status !== "cancelled")
      .filter(o => isWithinInterval(new Date(o.created_at), { start: rangeStart, end: rangeEnd }));
  }, [orders, rangeStart, rangeEnd]);

  const rangeSales = filteredOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const rangeOrderCount = filteredOrders.length;
  const rangeItemCount = filteredOrders.reduce(
    (s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0
  );
  const avgPerOrder = rangeOrderCount > 0 ? Math.round(rangeSales / rangeOrderCount) : 0;

  const occupiedTables = tables.filter(t => t.status === "occupied").length;
  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "preparing");

  const rangeLabel =
    preset === "custom" && customRange?.from
      ? `${format(customRange.from, "d MMM yyyy", { locale: th })}${
          customRange.to ? ` - ${format(customRange.to, "d MMM yyyy", { locale: th })}` : ""
        }`
      : presetLabels[preset];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">แดชบอร์ด</h2>
        <SoundToggle />
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">วันนี้</SelectItem>
            <SelectItem value="thisMonth">เดือนนี้</SelectItem>
            <SelectItem value="lastMonth">เดือนที่แล้ว</SelectItem>
            <SelectItem value="thisYear">ปีนี้</SelectItem>
            <SelectItem value="custom">กำหนดเอง (เลือกวัน)</SelectItem>
          </SelectContent>
        </Select>

        {preset === "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customRange?.from
                  ? customRange.to
                    ? `${format(customRange.from, "d MMM yyyy", { locale: th })} - ${format(
                        customRange.to,
                        "d MMM yyyy",
                        { locale: th }
                      )}`
                    : format(customRange.from, "d MMM yyyy", { locale: th })
                  : "เลือกช่วงวันที่"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={setCustomRange}
                numberOfMonths={2}
                defaultMonth={customRange?.from}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ยอดขาย ({rangeLabel})
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">฿{rangeSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{rangeItemCount} รายการอาหาร</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ออร์เดอร์ ({rangeLabel})
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rangeOrderCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">เฉลี่ยต่อออร์เดอร์</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{avgPerOrder.toLocaleString()}</div>
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

      {/* Orders within selected range */}
      <Card>
        <CardHeader>
          <CardTitle>
            ออร์เดอร์ในช่วง {rangeLabel} — {filteredOrders.length} รายการ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.slice(0, 20).map(order => {
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
            {filteredOrders.length === 0 && (
              <p className="text-center text-muted-foreground py-8">ไม่มีออร์เดอร์ในช่วงเวลานี้</p>
            )}
          </div>
          {filteredOrders.length > 20 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              แสดง 20 รายการล่าสุด จากทั้งหมด {filteredOrders.length} รายการในช่วงนี้
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
