import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Check, QrCode, X, Users, Copy } from "lucide-react";
import { promptPayPayload } from "@/lib/promptpay";
import { getPublicBaseUrl } from "@/lib/publicUrl";
import type {
  Reservation, ReservationItem, ReservationStatus, RestaurantSettings,
} from "@/types/restaurant";
import { reservationStatusLabels } from "@/types/restaurant";

const statusStyle: Record<ReservationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  seated: "bg-primary/10 text-primary border-primary/30",
};

export default function ReservationsPage() {
  const { getProductById, tables, setTableStatus, createOrder, getTableById } = useRestaurant();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [qrRow, setQrRow] = useState<Reservation | null>(null);
  const [confirmRow, setConfirmRow] = useState<Reservation | null>(null);
  const [ref, setRef] = useState("");
  const [saving, setSaving] = useState(false);


  const load = useCallback(async () => {
    const [r, i, s] = await Promise.all([
      supabase.from("reservations").select("*").order("reserved_at", { ascending: false }),
      supabase.from("reservation_items").select("*"),
      supabase.from("restaurant_settings").select("*").limit(1).maybeSingle(),
    ]);
    setRows((r.data ?? []) as Reservation[]);
    setItems((i.data ?? []) as ReservationItem[]);
    if (s.data) setSettings(s.data as RestaurantSettings);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("reservation-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "reservation_items" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  /** เลือกโต๊ะอัตโนมัติตามโซน/จำนวนคนที่ลูกค้าเลือก */
  const pickTable = (row: Reservation) => {
    if (row.table_id) return row.table_id;
    const candidates = tables
      .filter(t => t.status === "available")
      .filter(t => (row.zone ? t.zone === row.zone : true))
      .filter(t => t.seats >= row.guests)
      .sort((a, b) => a.seats - b.seats);
    const fallback = tables
      .filter(t => t.status === "available")
      .sort((a, b) => b.seats - a.seats);
    return candidates[0]?.id ?? fallback[0]?.id ?? null;
  };

  const setStatus = async (row: Reservation, status: ReservationStatus) => {
    const { error } = await supabase.from("reservations").update({ status }).eq("id", row.id);
    if (error) { toast.error("อัปเดตไม่สำเร็จ: " + error.message); return; }
    if (status === "cancelled" && row.table_id) {
      await supabase.from("tables").update({ status: "available" }).eq("id", row.table_id);
    }
    toast.success(`อัปเดตการจอง ${row.code} เป็น "${reservationStatusLabels[status]}"`);
    load();
  };

  const confirmTransfer = async () => {
    if (!confirmRow) return;
    setSaving(true);
    const tableId = pickTable(confirmRow);
    const { error } = await supabase.from("reservations")
      .update({ status: "confirmed", payment_ref: ref.trim(), table_id: tableId })
      .eq("id", confirmRow.id);
    if (!error && tableId) {
      await supabase.from("tables").update({ status: "reserved" }).eq("id", tableId);
    }
    setSaving(false);
    if (error) { toast.error("ยืนยันไม่สำเร็จ: " + error.message); return; }
    const num = tableId ? getTableById(tableId)?.number : undefined;
    toast.success(
      `ยืนยันการโอนของ #${confirmRow.code} แล้ว` +
      (num ? ` • จัดโต๊ะ ${num} ให้อัตโนมัติ` : " • ยังไม่มีโต๊ะว่างให้จัด"),
    );
    setConfirmRow(null);
    setRef("");
    load();
  };

  /** ลูกค้ามาถึง: เปิดโต๊ะ + ส่งอาหารที่สั่งล่วงหน้าเข้าครัวอัตโนมัติ */
  const seatReservation = async (row: Reservation) => {
    setSaving(true);
    const tableId = row.table_id ?? pickTable(row);
    if (!tableId) {
      setSaving(false);
      toast.error("ไม่มีโต๊ะว่าง — กรุณาจัดโต๊ะก่อน");
      return;
    }
    await supabase.from("tables").update({ status: "occupied" }).eq("id", tableId);
    await setTableStatus(tableId, "occupied");

    const list = items.filter(i => i.reservation_id === row.id);
    const cart = list
      .map(i => {
        const product = getProductById(i.product_id);
        return product ? { product, quantity: i.quantity, note: i.note } : null;
      })
      .filter((c): c is { product: NonNullable<ReturnType<typeof getProductById>>; quantity: number; note: string } => !!c);

    let sent = false;
    if (cart.length) {
      const id = await createOrder(tableId, cart, "reservation");
      sent = !!id;
    }

    await supabase.from("reservations")
      .update({ status: "seated", table_id: tableId })
      .eq("id", row.id);
    setSaving(false);
    const num = getTableById(tableId)?.number;
    toast.success(
      `เปิดโต๊ะ ${num ?? ""} สำหรับ #${row.code}` + (sent ? " • ส่งออร์เดอร์เข้าครัวแล้ว 🍳" : ""),
    );
    load();
  };



  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("restaurant_settings").update({
      promptpay_id: settings.promptpay_id,
      account_name: settings.account_name,
      deposit_amount: Number(settings.deposit_amount) || 0,
    }).eq("id", settings.id);
    setSaving(false);
    toast[error ? "error" : "success"](error ? "บันทึกไม่สำเร็จ" : "บันทึกการตั้งค่าแล้ว");
  };

  const bookingUrl = `${getPublicBaseUrl()}/book`;
  const qrValue = settings && qrRow ? promptPayPayload(settings.promptpay_id, Number(qrRow.total_due)) : "";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">การจองโต๊ะ</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ตั้งค่ารับมัดจำ</CardTitle>
          <CardDescription>ใช้สร้าง QR พร้อมเพย์บนหน้าจองของลูกค้า</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>พร้อมเพย์ (เบอร์โทร/เลขบัตร)</Label>
              <Input value={settings?.promptpay_id ?? ""} placeholder="0812345678"
                onChange={e => settings && setSettings({ ...settings, promptpay_id: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>ชื่อบัญชี</Label>
              <Input value={settings?.account_name ?? ""} placeholder="ร้านอาหาร..."
                onChange={e => settings && setSettings({ ...settings, account_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>ค่ามัดจำ (บาท)</Label>
              <Input type="number" min={0} value={settings?.deposit_amount ?? 0}
                onChange={e => settings && setSettings({ ...settings, deposit_amount: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={saveSettings} disabled={saving || !settings}>บันทึกการตั้งค่า</Button>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(bookingUrl); toast.success("คัดลอกลิงก์หน้าจองแล้ว"); }}>
              <Copy className="h-4 w-4 mr-1" /> คัดลอกลิงก์หน้าจอง
            </Button>
            <span className="text-xs text-muted-foreground break-all">{bookingUrl}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีรายการจอง</p>}
        {rows.map(r => {
          const list = items.filter(i => i.reservation_id === r.id);
          return (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">#{r.code} — {r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.phone}</p>
                  </div>
                  <Badge className={statusStyle[r.status]}>{reservationStatusLabels[r.status]}</Badge>
                </div>
                <p className="text-sm">{new Date(r.reserved_at).toLocaleString("th-TH")}</p>
                <p className="text-sm flex items-center gap-1">
                  <Users className="h-3 w-3" /> {r.guests} คน{r.zone ? ` • โซน ${r.zone}` : ""}
                  {r.table_id && getTableById(r.table_id) ? ` • โต๊ะ ${getTableById(r.table_id)!.number}` : ""}
                </p>
                {r.note && <p className="text-xs text-muted-foreground">หมายเหตุ: {r.note}</p>}

                {list.length > 0 && (
                  <div className="rounded-lg border p-2 space-y-1">
                    <p className="text-xs font-medium">อาหารสั่งล่วงหน้า</p>
                    {list.map(i => (
                      <p key={i.id} className="text-xs text-muted-foreground">
                        {getProductById(i.product_id)?.name ?? "เมนู"} × {i.quantity}
                        {i.note ? ` (${i.note})` : ""}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex justify-between text-sm font-semibold">
                  <span>ยอดต้องโอน</span>
                  <span className="text-primary">
                    ฿{Number(r.total_due).toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground"> (มัดจำ ฿{Number(r.deposit_amount).toLocaleString()})</span>
                  </span>
                </div>

                {r.payment_ref && <p className="text-xs text-muted-foreground">อ้างอิงการโอน: {r.payment_ref}</p>}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setQrRow(r)}>
                    <QrCode className="h-3 w-3 mr-1" /> QR โอน
                  </Button>
                  {r.status === "pending" && (
                    <Button size="sm" onClick={() => { setConfirmRow(r); setRef(r.payment_ref ?? ""); }}>
                      <Check className="h-3 w-3 mr-1" /> ยืนยันโอนแล้ว
                    </Button>
                  )}

                  {r.status === "confirmed" && (
                    <Button size="sm" disabled={saving} onClick={() => seatReservation(r)}>ลูกค้ามาถึงแล้ว</Button>
                  )}
                  {r.status !== "cancelled" && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(r, "cancelled")}>
                      <X className="h-3 w-3 mr-1" /> ยกเลิก
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!qrRow} onOpenChange={o => !o && setQrRow(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">QR มัดจำ #{qrRow?.code}</DialogTitle>
            <DialogDescription className="text-center">
              ยอด ฿{Number(qrRow?.total_due ?? 0).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-2">
            {qrValue
              ? <QRCodeSVG value={qrValue} size={220} includeMargin />
              : <p className="text-sm text-center text-muted-foreground">
                  ยังไม่ได้ตั้งค่าพร้อมเพย์ — รับเงินช่องทางอื่นแล้วกดยืนยันได้เลย
                </p>}
            {settings?.account_name && <p className="text-sm font-medium">{settings.account_name}</p>}
            {qrRow?.status === "pending" && (
              <Button className="w-full mt-1" onClick={() => {
                const r = qrRow; setQrRow(null); setRef(r.payment_ref ?? ""); setConfirmRow(r);
              }}>
                <Check className="h-4 w-4 mr-1" /> ยืนยันโอนแล้ว
              </Button>
            )}
          </div>

        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRow} onOpenChange={o => !o && setConfirmRow(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ยืนยันการโอนเงิน #{confirmRow?.code}</DialogTitle>
            <DialogDescription>
              {confirmRow?.name} • ยอด ฿{Number(confirmRow?.total_due ?? 0).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>เลขอ้างอิง / หมายเหตุการโอน (ไม่บังคับ)</Label>
            <Input value={ref} onChange={e => setRef(e.target.value)} placeholder="เช่น 4 หลักท้ายสลิป หรือเวลาโอน" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmRow(null)}>ปิด</Button>
            <Button onClick={confirmTransfer} disabled={saving}>
              <Check className="h-4 w-4 mr-1" /> {saving ? "กำลังบันทึก..." : "ยืนยันได้รับเงิน"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
