import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { Minus, Plus, Trash2, Printer, PlusCircle, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { MenuPicker } from "@/components/MenuPicker";
import { orderStatusLabels, type CartItem, type Order } from "@/types/restaurant";


const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  served: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function OrdersPage() {
  const {
    orders, categories, products, payments,
    getProductById, getTableById, updateOrderStatus, processPayment,
    setItemQuantity, setItemNote, addItemsToOrder,
  } = useRestaurant();
  const [filter, setFilter] = useState<string>("all");
  const [addTo, setAddTo] = useState<Order | null>(null);
  const [qrOrder, setQrOrder] = useState<Order | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});


  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const editable = (o: Order) => o.status === 'pending' || o.status === 'preparing';

  const submitAdd = async () => {
    if (!addTo || !cart.length) return;
    await addItemsToOrder(addTo.id, cart);
    toast.success("เพิ่มรายการเข้าออร์เดอร์แล้ว");
    setCart([]);
    setAddTo(null);
  };

  const printReceipt = (order: Order) => {
    const table = getTableById(order.table_id);
    const paid = payments.find(p => p.order_id === order.id && p.status === 'completed');
    const rows = order.items.map(i => {
      const p = getProductById(i.product_id);
      return `<tr><td>${p?.name ?? ''} x${i.quantity}${i.note ? `<br/><small>* ${i.note}</small>` : ''}</td><td style="text-align:right">${Number(i.price) * i.quantity}</td></tr>`;
    }).join('');
    const html = `<html><head><title>ใบเสร็จ #${order.order_no}</title>
      <style>body{font-family:sans-serif;padding:16px;max-width:320px}h2{text-align:center}table{width:100%;font-size:14px}td{padding:4px 0}
      .total{border-top:1px dashed #000;font-weight:bold}</style></head><body>
      <h2>🍊 ใบเสร็จรับเงิน</h2>
      <p>เลขที่ #${order.order_no}<br/>โต๊ะ ${table?.number ?? '-'}<br/>${new Date(order.created_at).toLocaleString('th-TH')}</p>
      <table>${rows}<tr class="total"><td>รวมทั้งสิ้น</td><td style="text-align:right">฿${Number(order.total_amount).toLocaleString()}</td></tr></table>
      <p>การชำระเงิน: ${paid ? (paid.method === 'cash' ? 'เงินสด' : 'QR Code') : 'ยังไม่ชำระ'}</p>
      <p style="text-align:center">ขอบคุณที่ใช้บริการ</p>
      <script>window.print()</script></body></html>`;
    const w = window.open('', '_blank', 'width=400,height=600');
    if (w) { w.document.write(html); w.document.close(); }
  };

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
            <SelectItem value="cancelled">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filtered.map(order => {
          const table = getTableById(order.table_id);
          const paid = payments.some(p => p.order_id === order.id && p.status === 'completed');
          const request = payments.find(p => p.order_id === order.id && p.status === 'pending');

          return (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-lg">
                    โต๊ะ {table?.number} — #{order.order_no}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {order.source === 'customer' ? 'ลูกค้าสแกน QR' : 'พนักงาน'}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {paid && <Badge className="bg-green-100 text-green-800">ชำระแล้ว</Badge>}
                    {!paid && request && (
                      <Badge className="bg-orange-100 text-orange-800">
                        ลูกค้าขอชำระ: {request.method === 'cash' ? 'เงินสด' : 'QR Code'}
                      </Badge>
                    )}
                    <Badge className={statusColors[order.status]}>{orderStatusLabels[order.status]}</Badge>

                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleString('th-TH')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {order.items.map(item => {
                    const product = getProductById(item.product_id);
                    const draft = noteDrafts[item.id] ?? item.note ?? "";
                    return (
                      <div key={item.id} className="rounded-lg border p-2 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span>{product?.image} {product?.name}</span>
                          <div className="flex items-center gap-2">
                            {editable(order) ? (
                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setItemQuantity(item, item.quantity - 1)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center">{item.quantity}</span>
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setItemQuantity(item, item.quantity + 1)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setItemQuantity(item, 0)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span>x{item.quantity}</span>
                            )}
                            <span className="w-16 text-right">฿{Number(item.price) * item.quantity}</span>
                          </div>
                        </div>
                        {editable(order) ? (
                          <div className="flex gap-2">
                            <Input
                              className="h-8 text-sm"
                              placeholder="คำขอพิเศษ เช่น เพิ่มไข่ ไม่ใส่ผัก"
                              value={draft}
                              onChange={e => setNoteDrafts(d => ({ ...d, [item.id]: e.target.value }))}
                            />
                            <Button size="sm" variant="outline" onClick={async () => {
                              await setItemNote(item.id, draft);
                              toast.success("บันทึกคำขอแล้ว");
                            }}>
                              บันทึก
                            </Button>
                          </div>
                        ) : item.note ? (
                          <p className="text-xs text-muted-foreground">* {item.note}</p>
                        ) : null}
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>รวม</span>
                    <span>฿{Number(order.total_amount).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {editable(order) && (
                    <Button size="sm" variant="secondary" onClick={() => { setCart([]); setAddTo(order); }}>
                      <PlusCircle className="h-4 w-4 mr-1" /> เพิ่มรายการ
                    </Button>
                  )}
                  {order.status === 'pending' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>เริ่มทำ</Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')}>ทำเสร็จ</Button>
                  )}
                  {(order.status === 'ready' || order.status === 'served') && (
                    <>
                      {order.status === 'ready' && (
                        <Button size="sm" onClick={() => updateOrderStatus(order.id, 'served')}>เสิร์ฟแล้ว</Button>
                      )}
                      {!paid && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => setQrOrder(order)}>
                            <QrCode className="h-4 w-4 mr-1" /> ออก QR ให้สแกน
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => processPayment(order.id, 'cash')}>ยืนยันชำระเงินสด</Button>
                          <Button size="sm" variant="outline" onClick={() => processPayment(order.id, 'qr_code')}>ยืนยันชำระ QR</Button>
                        </>
                      )}

                      <Button size="sm" variant="ghost" onClick={() => printReceipt(order)}>
                        <Printer className="h-4 w-4 mr-1" /> ใบเสร็จ
                      </Button>
                    </>
                  )}
                  {editable(order) && (
                    <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, 'cancelled')}>ยกเลิก</Button>
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

      <Dialog open={!!addTo} onOpenChange={o => !o && setAddTo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>เพิ่มรายการ — ออร์เดอร์ #{addTo?.order_no}</DialogTitle>
          </DialogHeader>
          <MenuPicker categories={categories} products={products} cart={cart} setCart={setCart} />
          <DialogFooter>
            <Button onClick={submitAdd} disabled={!cart.length}>เพิ่มเข้าออร์เดอร์</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
