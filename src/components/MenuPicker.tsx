import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem, Category, Product } from "@/types/restaurant";
import { ProductThumb } from "@/components/ProductThumb";


interface Props {
  categories: Category[];
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export function MenuPicker({ categories, products, cart, setCart }: Props) {
  const [cat, setCat] = useState<string>("all");

  const list = products.filter(p => p.available && (cat === "all" || p.category_id === cat));
  const total = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  const add = (product: Product) =>
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button size="sm" variant={cat === "all" ? "default" : "outline"} onClick={() => setCat("all")}>ทั้งหมด</Button>
        {categories.map(c => (
          <Button key={c.id} size="sm" variant={cat === c.id ? "default" : "outline"} className="whitespace-nowrap" onClick={() => setCat(c.id)}>
            {c.icon} {c.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-auto">
        {list.map(p => (
          <Card key={p.id} className="cursor-pointer hover:border-primary" onClick={() => add(p)}>
            <CardContent className="p-3 text-center">
              <div className="flex justify-center">
                <ProductThumb image={p.image} name={p.name} className="h-12 w-12" emojiClassName="text-2xl" />
              </div>

              <p className="text-sm font-medium leading-tight">{p.name}</p>
              <p className="text-xs text-primary font-semibold">฿{Number(p.price)}</p>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground py-6">ไม่มีเมนูในหมวดนี้</p>}
      </div>

      <div className="border-t pt-3 space-y-2 max-h-56 overflow-auto">
        {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">ยังไม่ได้เลือกรายการ</p>}
        {cart.map(i => (
          <div key={i.product.id} className="space-y-1 rounded-lg border p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{i.product.image} {i.product.name}</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.product.id, i.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm">{i.quantity}</span>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.product.id, i.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setQty(i.product.id, 0)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Input
              className="h-8 text-sm"
              placeholder="คำขอพิเศษ เช่น ไม่ใส่ผัก, เพิ่มไข่, เผ็ดน้อย"
              value={i.note ?? ""}
              onChange={e => setNote(i.product.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between font-bold text-lg">
        <span>รวม</span>
        <span className="text-primary">฿{total.toLocaleString()}</span>
      </div>
    </div>
  );
}
