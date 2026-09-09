import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { toast } from "sonner";
import { SoundToggle } from "@/components/SoundToggle";
import { playSound } from "@/lib/sound";
import { ProductThumb } from "@/components/ProductThumb";

export default function KitchenPage() {
  const { orders, getProductById, getTableById, updateOrderStatus, onNewOrder } = useRestaurant();

  useEffect(() => {
    const off = onNewOrder(({ tableId }) => {
      const table = getTableById(tableId);
      toast.success(`ออร์เดอร์ใหม่เข้าครัว — โต๊ะ ${table?.number ?? "-"} 🍳`);
      playSound("newOrder");
    });
    return off;
  }, [onNewOrder, getTableById]);

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready');

  const columns = [
    { status: 'pending', label: '🔴 รอรับ', color: 'border-yellow-400' },
    { status: 'preparing', label: '🟡 กำลังทำ', color: 'border-blue-400' },
    { status: 'ready', label: '🟢 เสร็จแล้ว', color: 'border-green-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ห้องครัว</h2>
        <SoundToggle />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(col => {
          const colOrders = activeOrders.filter(o => o.status === col.status);
          return (
            <div key={col.status}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {col.label}
                <Badge variant="secondary">{colOrders.length}</Badge>
              </h3>
              <div className="space-y-3">
                {colOrders.map(order => {
                  const table = getTableById(order.table_id);
                  const mins = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);
                  return (
                    <Card key={order.id} className={`border-l-4 ${col.color}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">โต๊ะ {table?.number}</CardTitle>
                          <span className="text-xs text-muted-foreground">{mins} นาทีที่แล้ว</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 mb-3">
                          {order.items.map(item => {
                            const product = getProductById(item.product_id);
                            return (
                              <li key={item.id} className="text-sm flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                  {product && <ProductThumb image={product.image} name={product.name} className="h-8 w-8" emojiClassName="text-xl" />}
                                  {product?.name}
                                </span>
                                <span className="font-medium">x{item.quantity}</span>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="flex gap-2">
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
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {colOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-6 text-sm">ไม่มีรายการ</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
