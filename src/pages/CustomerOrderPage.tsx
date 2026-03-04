import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2, Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { toast } from "sonner";

export default function CustomerOrderPage() {
  const {
    tables, categories, products, cart,
    addToCart, removeFromCart, updateCartQuantity, clearCart,
    createOrder, isTableOpen,
  } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedCat, setSelectedCat] = useState<string>(categories[0]?.id || "");

  const openTables = tables.filter(t => t.status === 'occupied');
  const filteredProducts = products.filter(p => p.categoryId === selectedCat && p.available);
  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleSubmitOrder = () => {
    if (!selectedTable) {
      toast.error("กรุณาเลือกโต๊ะก่อน");
      return;
    }
    if (!isTableOpen(selectedTable)) {
      toast.error("โต๊ะนี้ยังไม่ได้เปิด กรุณาแจ้งพนักงาน");
      return;
    }
    if (cart.length === 0) {
      toast.error("กรุณาเลือกรายการอาหาร");
      return;
    }
    createOrder(selectedTable, cart);
    clearCart();
    toast.success("สั่งอาหารสำเร็จ! 🎉");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">สั่งอาหาร</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              ตะกร้า
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>ตะกร้าสินค้า</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-auto space-y-3 py-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">ยังไม่มีรายการ</p>
              ) : cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.product.image}</span>
                    <div>
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">฿{item.product.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <SheetFooter className="border-t pt-4 flex-col gap-3">
                <div className="flex justify-between w-full text-lg font-bold">
                  <span>รวมทั้งหมด</span>
                  <span className="text-primary">฿{cartTotal}</span>
                </div>
                <Button className="w-full" size="lg" onClick={handleSubmitOrder}>
                  <Send className="h-4 w-4 mr-2" />
                  ส่งออร์เดอร์
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Table selection */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">เลือกโต๊ะ</h3>
          {openTables.length === 0 ? (
            <p className="text-muted-foreground text-sm">ไม่มีโต๊ะที่เปิดอยู่ กรุณาแจ้งพนักงานเปิดโต๊ะ</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {openTables.map(table => (
                <Button
                  key={table.id}
                  variant={selectedTable === table.id ? "default" : "outline"}
                  onClick={() => setSelectedTable(table.id)}
                >
                  โต๊ะ {table.number}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCat === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCat(cat.id)}
            className="whitespace-nowrap"
          >
            {cat.icon} {cat.name}
          </Button>
        ))}
      </div>

      {/* Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => {
          const inCart = cart.find(i => i.product.id === product.id);
          return (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{product.image}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-xs text-muted-foreground">{product.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-bold text-lg">฿{product.price}</span>
                      {inCart ? (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(product.id, inCart.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{inCart.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => addToCart(product)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => addToCart(product)}>
                          <Plus className="h-3 w-3 mr-1" /> เพิ่ม
                        </Button>
                      )}
                    </div>
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
    </div>
  );
}
