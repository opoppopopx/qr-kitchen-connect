import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, UtensilsCrossed, Clock } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  preparing: "bg-blue-100 text-blue-800 border-blue-300",
  ready: "bg-green-100 text-green-800 border-green-300",
  served: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  pending: "รอรับออร์เดอร์",
  preparing: "กำลังทำ",
  ready: "ทำเสร็จแล้ว",
  served: "เสิร์ฟแล้ว",
  cancelled: "ยกเลิก",
};

export default function Dashboard() {
  const { orders, tables, todaySales, todayOrderCount, getProductById, getTableById } = useRestaurant();

  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">แดชบอร์ด</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ยอดขายวันนี้</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">฿{todaySales.toLocaleString()}</div>
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

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>ออร์เดอร์ล่าสุด</CardTitle>
        </CardHeader>
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
                    <span className="font-semibold">฿{order.total_amount}</span>
                    <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
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
