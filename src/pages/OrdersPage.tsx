import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  pending: "รอรับออร์เดอร์",
  preparing: "กำลังทำ",
  ready: "ทำเสร็จแล้ว",
  served: "เสิร์ฟแล้ว",
  cancelled: "ยกเลิก",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  served: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function OrdersPage() {
  const { orders, getProductById, getTableById, updateOrderStatus, processPayment } = useRestaurant();
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ออร์เดอร์</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="กรองสถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="pending">รอรับออร์เดอร์</SelectItem>
            <SelectItem value="preparing">กำลังทำ</SelectItem>
            <SelectItem value="ready">ทำเสร็จแล้ว</SelectItem>
            <SelectItem value="served">เสิร์ฟแล้ว</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filtered.map(order => {
          const table = getTableById(order.table_id);
          return (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">โต๊ะ {table?.number} — #{order.id}</CardTitle>
                  <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleTimeString('th-TH')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {order.items.map(item => {
                    const product = getProductById(item.product_id);
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{product?.image} {product?.name} x{item.quantity}</span>
                        <span>฿{item.price * item.quantity}</span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>รวม</span>
                    <span>฿{order.total_amount}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {order.status === 'pending' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                      เริ่มทำ
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')}>
                      ทำเสร็จ
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <>
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, 'served')}>
                        เสิร์ฟแล้ว
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => processPayment(order.id, 'cash')}>
                        ชำระเงินสด
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => processPayment(order.id, 'qr_code')}>
                        ชำระ QR Code
                      </Button>
                    </>
                  )}
                  {(order.status === 'pending' || order.status === 'preparing') && (
                    <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                      ยกเลิก
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">ไม่มีออร์เดอร์</p>
        )}
      </div>
    </div>
  );
}
