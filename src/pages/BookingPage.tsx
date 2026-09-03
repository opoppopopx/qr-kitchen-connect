import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { CalendarCheck, Search, UtensilsCrossed } from "lucide-react";
import { MenuPicker } from "@/components/MenuPicker";
import { promptPayPayload } from "@/lib/promptpay";
import type {
  CartItem, Category, Product, Reservation, RestaurantSettings,
} from "@/types/restaurant";
import { reservationStatusLabels } from "@/types/restaurant";

const statusStyle: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  seated: "bg-primary/10 text-primary border-primary/30",
};

export default function BookingPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [when, setWhen] = useState("");
  const [zone, setZone] = useState("");
  const [note, setNote] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  const [created, setCreated] = useState<Reservation | null>(null);
  const [lookupCode, setLookupCode] = useState("");
  const [found, setFound] = useState<Reservation | null>(null);

  useEffect(() => {
    (async () => {
      const [s, c, p, t] = await Promise.all([
        supabase.from("restaurant_settings").select("*").limit(1).maybeSingle(),
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("*").order("created_at"),
        supabase.from("tables").select("zone"),
      ]);
      if (s.data) setSettings(s.data as RestaurantSettings);
      setCategories((c.data ?? []) as Category[]);
      setProducts((p.data ?? []) as Product[]);
      setZones([...new Set(((t.data ?? []) as { zone: string }[]).map(x => x.zone))].sort());
    })();
  }, []);

  const deposit = Number(settings?.deposit_amount ?? 100);
  const foodTotal = useMemo(
    () => cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0),
    [cart],
  );
  const totalDue = deposit + foodTotal;

  const active = created ?? found;
  const qrValue = settings && active
    ? promptPayPayload(settings.promptpay_id, Number(active.total_due))
    : "";

  const submit = async () => {
    if (!name.trim()) return toast.error("กรุณากรอกชื่อผู้จอง");
    if (!phone.trim()) return toast.error("กรุณากรอกเบอร์โทรติดต่อ");
    if (!when) return toast.error("กรุณาเลือกวันและเวลาที่ต้องการจอง");
    if (new Date(when).getTime() < Date.now()) return toast.error("กรุณาเลือกเวลาในอนาคต");

    setBusy(true);
    const { data, error } = await supabase.from("reservations").insert({
      name: name.trim(),
      phone: phone.trim(),
      guests,
      reserved_at: new Date(when).toISOString(),
      zone,
      note: note.trim(),
      food_amount: foodTotal,
      deposit_amount: deposit,
      total_due: totalDue,
      status: "pending",
    }).select("*").single();

    if (error || !data) {
      setBusy(false);
      toast.error("จองไม่สำเร็จ กรุณาลองอีกครั้ง");
      return;
    }

    if (cart.length) {
      await supabase.from("reservation_items").insert(cart.map(i => ({
        reservation_id: data.id,
        product_id: i.product.id,
        quantity: i.quantity,
        price: Number(i.product.price),
        note: i.note ?? "",
      })));
    }
    setBusy(false);
    setCreated(data as Reservation);
    setFound(null);
    toast.success("บันทึกการจองแล้ว กรุณาโอนมัดจำเพื่อยืนยัน");
  };

  const lookup = async () => {
    const code = lookupCode.trim().toUpperCase();
    if (!code) return;
    const { data } = await supabase.from("reservations").select("*").eq("code", code).maybeSingle();
    if (!data) return toast.error("ไม่พบรหัสการจองนี้");
    setFound(data as Reservation);
    setCreated(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold leading-none">จองโต๊ะล่วงหน้า</h1>
            <p className="text-xs text-muted-foreground">ยืนยันการจองด้วยการโอนมัดจำ</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {active ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>รหัสการจอง {active.code}</CardTitle>
              <CardDescription>
                <Badge className={statusStyle[active.status]}>{reservationStatusLabels[active.status]}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-1">
                <p>ชื่อ: <span className="font-medium">{active.name}</span></p>
                <p>วันเวลา: <span className="font-medium">{new Date(active.reserved_at).toLocaleString("th-TH")}</span></p>
                <p>จำนวน: <span className="font-medium">{active.guests} คน</span>{active.zone ? ` • โซน ${active.zone}` : ""}</p>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span>ค่ามัดจำ</span><span>฿{Number(active.deposit_amount).toLocaleString()}</span></div>
                {Number(active.food_amount) > 0 && (
                  <div className="flex justify-between"><span>อาหารสั่งล่วงหน้า</span><span>฿{Number(active.food_amount).toLocaleString()}</span></div>
                )}
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>ยอดที่ต้องโอน</span>
                  <span className="text-primary">฿{Number(active.total_due).toLocaleString()}</span>
                </div>
              </div>

              {active.status === "pending" && (
                <div className="flex flex-col items-center gap-2 rounded-xl border p-4">
                  {qrValue ? (
                    <>
                      <QRCodeSVG value={qrValue} size={220} includeMargin />
                      <p className="text-sm font-medium">พร้อมเพย์: {settings?.account_name || settings?.promptpay_id}</p>
                    </>
                  ) : (
                    <p className="text-sm text-center text-muted-foreground">
                      ร้านยังไม่ได้ตั้งค่าพร้อมเพย์ กรุณาติดต่อร้านเพื่อโอนมัดจำ
                    </p>
                  )}
                  <p className="text-xs text-center text-muted-foreground">
                    สแกนโอนยอดด้านบน แล้วแจ้งสลิป/รหัสการจอง <b>{active.code}</b> ให้พนักงาน
                    การจองจะสมบูรณ์เมื่อพนักงานตรวจสอบยอดโอนแล้ว
                  </p>
                </div>
              )}

              {active.status === "confirmed" && (
                <p className="text-center text-sm text-green-700 font-medium">
                  ยืนยันการจองเรียบร้อย 🎉 พบกันที่ร้านตามเวลาที่จองไว้
                </p>
              )}

              <Button variant="outline" className="w-full" onClick={() => { setCreated(null); setFound(null); }}>
                จองรายการใหม่
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลการจอง</CardTitle>
                <CardDescription>ค่ามัดจำ ฿{deposit.toLocaleString()} ต่อการจอง (หักเป็นค่าอาหารเมื่อมาถึงร้าน)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>ชื่อผู้จอง</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="ชื่อ-นามสกุล" />
                  </div>
                  <div className="space-y-1">
                    <Label>เบอร์โทร</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} placeholder="08xxxxxxxx" />
                  </div>
                  <div className="space-y-1">
                    <Label>วันและเวลา</Label>
                    <Input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>จำนวนคน</Label>
                    <Input type="number" min={1} max={50} value={guests}
                      onChange={e => setGuests(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} />
                  </div>
                </div>

                {zones.length > 0 && (
                  <div className="space-y-1">
                    <Label>โซนที่ต้องการ (ถ้ามี)</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={zone === "" ? "default" : "outline"} onClick={() => setZone("")}>ไม่ระบุ</Button>
                      {zones.map(z => (
                        <Button key={z} size="sm" variant={zone === z ? "default" : "outline"} onClick={() => setZone(z)}>
                          โซน {z}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label>หมายเหตุ</Label>
                  <Textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500}
                    placeholder="เช่น ขอโต๊ะริมหน้าต่าง, ฉลองวันเกิด" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">สั่งอาหารล่วงหน้า (ไม่บังคับ)</CardTitle>
                <CardDescription>ถ้าสั่งล่วงหน้า ยอดค่าอาหารจะถูกบวกเข้ากับยอดที่ต้องโอน</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {showMenu ? (
                  <MenuPicker categories={categories} products={products} cart={cart} setCart={setCart} />
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setShowMenu(true)}>
                    เลือกเมนูล่วงหน้า
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm"><span>ค่ามัดจำ</span><span>฿{deposit.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span>อาหารล่วงหน้า</span><span>฿{foodTotal.toLocaleString()}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>ยอดที่ต้องโอน</span><span className="text-primary">฿{totalDue.toLocaleString()}</span>
                </div>
                <Button className="w-full h-12" onClick={submit} disabled={busy}>
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  {busy ? "กำลังบันทึก..." : "จองและรับ QR โอนมัดจำ"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ตรวจสอบการจองเดิม</CardTitle>
                <CardDescription>กรอกรหัสการจอง 6 หลักที่ได้รับ</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input value={lookupCode} onChange={e => setLookupCode(e.target.value.toUpperCase())} placeholder="เช่น A1B2C3" />
                <Button variant="outline" onClick={lookup}><Search className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
