import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, LogOut } from "lucide-react";

const columns = [
  { status: 'pending', label: '🔴 รอรับ', color: 'border-yellow-400' },
  { status: 'preparing', label: '🟡 กำลังทำ', color: 'border-blue-400' },
  { status: 'ready', label: '🟢 เสร็จแล้ว', color: 'border-green-400' },
] as const;

export default function KitchenDisplayPage() {
  const { user, profile, role, loading, signOut } = useAuth();
  const { orders, getProductById, getTableById, updateOrderStatus } = useRestaurant();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">กำลังโหลด...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && !['kitchen', 'admin', 'manager'].includes(role)) return <Navigate to="/" replace />;

  const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg leading-tight">จอครัว (Kitchen Display)</h1>
            <p className="text-xs text-muted-foreground">
              {profile?.full_name || profile?.username} • ออร์เดอร์ค้าง {activeOrders.length} รายการ
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-1" /> ออกจากระบบ
        </Button>
      </header>

      <main className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colOrders = activeOrders.filter(o => o.status === col.status);
          return (
            <section key={col.status}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {col.label}
                <Badge variant="secondary">{colOrders.length}</Badge>
              </h2>
              <div className="space-y-3">
                {colOrders.map(order => {
                  const table = getTableById(order.table_id);
                  const mins = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);
                  return (
                    <Card key={order.id} className={`border-l-4 ${col.color}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">โต๊ะ {table?.number} • #{order.order_no}</CardTitle>
                          <span className="text-xs text-muted-foreground">{mins} นาทีที่แล้ว</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 mb-3">
                          {order.items.map(item => {
                            const product = getProductById(item.product_id);
                            return (
                              <li key={item.id} className="text-sm">
                                <div className="flex justify-between">
                                  <span>{product?.image} {product?.name}</span>
                                  <span className="font-medium">x{item.quantity}</span>
                                </div>
                                {item.note && <p className="text-xs text-destructive">📝 {item.note}</p>}
                              </li>
                            );
                          })}
                        </ul>
                        {col.status === 'pending' && (
                          <Button size="sm" className="w-full" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                            เริ่มทำ
                          </Button>
                        )}
                        {col.status === 'preparing' && (
                          <Button size="sm" className="w-full" onClick={() => updateOrderStatus(order.id, 'ready')}>
                            ทำเสร็จ ✅
                          </Button>
                        )}
                        {col.status === 'ready' && (
                          <Button size="sm" variant="outline" className="w-full" onClick={() => updateOrderStatus(order.id, 'served')}>
                            เสิร์ฟแล้ว
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {colOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-6 text-sm">ไม่มีรายการ</p>
                )}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
