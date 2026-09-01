import { useParams } from "react-router-dom";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2, Send, QrCode, Banknote, BellRing } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import type { CartItem, Product } from "@/types/restaurant";
import { orderStatusLabels } from "@/types/restaurant";

export default function CustomerOrderPage() {
  const { tableId } = useParams();
  const { tables, categories, products, orders, payments, createOrder, requestPayment, loading } = useRestaurant();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [payOpen, setPayOpen] = useState(false);
  const [payDismissed, setPayDismissed] = useState(false);
  const [qrPay, setQrPay] = useState(false);

  const table = tables.find(t => t.id === tableId);
  const myOrders = useMemo(
    () => orders.filter(o => o.table_id === tableId && o.status !== 'cancelled'),
    [orders, tableId],
  );
  const unpaidTotal = myOrders.reduce((s, o) => s + Number(o.total_amount), 0);

  // Orders that were served but have no payment record yet
  const servedUnpaid = useMemo(
    () => myOrders.filter(o => o.status === 'served' && !payments.some(p => p.order_id === o.id)),
    [myOrders, payments],
  );
  const payTotal = servedUnpaid.reduce((s, o) => s + Number(o.total_amount), 0);

  useEffect(() => {
    if (servedUnpaid.length > 0 && !payDismissed) setPayOpen(true);
    if (servedUnpaid.length === 0) { setPayOpen(false); setPayDismissed(false); setQrPay(false); }
  }, [servedUnpaid.length, payDismissed]);


  const addToCart = (product: Product) =>
    setCart(prev => {
      const found = prev.find(i => i.product.id === product.id);
      if (found) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, note: "" }];
    });
  const setQty = (id: string, quantity: number) =>
    setCart(prev => quantity <= 0
      ? prev.filter(i => i.product.id !== id)
      : prev.map(i => i.product.id === id ? { ...i, quantity } : i));
  const setNote = (id: string, note: string) =>
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, note } : i));

  const filteredProducts = products.filter(p => p.available && (selectedCat === "all" || p.category_id === selectedCat));
  const cartTotal = cart.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const submitOrder = async () => {
    if (!table) return;
    if (table.status !== 'occupied') {
      toast.error("โต๊ะนี้ยังไม่ได้เปิด กรุณาแจ้งพนักงาน");
      return;
    }
    if (!cart.length) {
      toast.error("กรุณาเลือกรายการอาหาร");
      return;
    }
    const id = await createOrder(table.id, cart, 'customer');
    if (!id) {
      toast.error("สั่งอาหารไม่สำเร็จ กรุณาแจ้งพนักงาน");
      return;
    }
    setCart([]);
    toast.success("ส่งออร์เดอร์ไปที่ครัวแล้ว 🎉");
  };

  const pay = async (method: 'cash' | 'qr_code') => {
    const pending = myOrders.filter(o => o.status !== 'cancelled');
    if (!pending.length) {
      toast.error("ยังไม่มีออร์เดอร์");
      return;
    }
    for (const o of pending) await requestPayment(o.id, method, Number(o.total_amount));
    toast.success(method === 'cash' ? "แจ้งชำระเงินสดแล้ว พนักงานจะมาที่โต๊ะ" : "แจ้งชำระผ่าน QR แล้ว");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">กำลังโหลดเมนู...</div>;
  }

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-2">😕</p>
          <p className="font-semibold">ไม่พบโต๊ะนี้</p>
          <p className="text-sm text-muted-foreground">กรุณาสแกน QR ที่โต๊ะอีกครั้ง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-6">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">ระบบสั่งอาหาร QR</p>
          <h1 className="font-bold text-primary">โต๊ะ {table.number} • โซน {table.zone}</h1>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" /> ตะกร้า
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col w-full sm:max-w-md">
            <SheetHeader><SheetTitle>ตะกร้าสินค้า</SheetTitle></SheetHeader>
            <div className="flex-1 overflow-auto space-y-3 py-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">ยังไม่มีรายการ</p>
              ) : cart.map(item => (
                <div key={item.product.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.product.image}</span>
                      <div>
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">฿{Number(item.product.price)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(item.product.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(item.product.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setQty(item.product.id, 0)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Input
                    className="h-8 text-sm"
                    placeholder="คำขอพิเศษ เช่น ไม่ใส่ผัก เผ็ดน้อย"
                    value={item.note ?? ""}
                    onChange={e => setNote(item.product.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <SheetFooter className="border-t pt-4 flex-col gap-3">
                <div className="flex justify-between w-full text-lg font-bold">
                  <span>รวมทั้งหมด</span>
                  <span className="text-primary">฿{cartTotal.toLocaleString()}</span>
                </div>
                <Button className="w-full" size="lg" onClick={submitOrder}>
                  <Send className="h-4 w-4 mr-2" /> ส่งออร์เดอร์
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </header>

      <div className="p-4 space-y-4">
        {table.status !== 'occupied' && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-sm">
              โต๊ะนี้ยังไม่ได้เปิดใช้งาน กรุณาแจ้งพนักงานเพื่อเปิดโต๊ะก่อนสั่งอาหาร
            </CardContent>
          </Card>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button size="sm" variant={selectedCat === "all" ? "default" : "outline"} onClick={() => setSelectedCat("all")}>ทั้งหมด</Button>
          {categories.map(cat => (
            <Button key={cat.id} size="sm" variant={selectedCat === cat.id ? "default" : "outline"} className="whitespace-nowrap" onClick={() => setSelectedCat(cat.id)}>
              {cat.icon} {cat.name}
            </Button>
          ))}
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map(product => {
            const inCart = cart.find(i => i.product.id === product.id);
            return (
              <Card key={product.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="text-4xl">{product.image}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-xs text-muted-foreground">{product.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-bold text-lg">฿{Number(product.price)}</span>
                      {inCart ? (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(product.id, inCart.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{inCart.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => addToCart(product)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => addToCart(product)} disabled={table.status !== 'occupied'}>
                          <Plus className="h-3 w-3 mr-1" /> เพิ่ม
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredProducts.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">ไม่มีเมนูในหมวดนี้</p>
          )}
        </div>

        {/* My orders + payment */}
        {myOrders.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">ออร์เดอร์ของโต๊ะนี้</h3>
              {myOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <span>#{o.order_no} • {o.items.length} รายการ</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{orderStatusLabels[o.status]}</Badge>
                    <span className="font-semibold">฿{Number(o.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between font-bold">
                <span>ยอดรวม</span>
                <span className="text-primary">฿{unpaidTotal.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => pay('cash')}>
                  <Banknote className="h-4 w-4 mr-2" /> ชำระเงินสด
                </Button>
                <Button onClick={() => pay('qr_code')}>
                  <QrCode className="h-4 w-4 mr-2" /> ชำระ QR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
