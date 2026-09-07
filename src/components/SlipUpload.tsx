import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Clock, Upload, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { submitSlip } from "@/lib/paymentSlip";
import type { PaymentSlip, PaymentSlipKind } from "@/types/restaurant";

interface Props {
  kind: PaymentSlipKind;
  orderId?: string | null;
  reservationId?: string | null;
  amount: number;
  /** ข้อความช่วยพนักงานอ้างอิง เช่น รหัสจอง */
  defaultNote?: string;
}

/** ให้ลูกค้าอัปโหลดสลิปโอนเงิน ระบบเช็คสลิปซ้ำแล้วส่งให้พนักงานกดยืนยันในคลิกเดียว */
export function SlipUpload({ kind, orderId, reservationId, amount, defaultNote = "" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(defaultNote);
  const [slip, setSlip] = useState<PaymentSlip | null>(null);

  // ติดตามสถานะสลิปแบบเรียลไทม์ เพื่อบอกลูกค้าเมื่อพนักงานยืนยันแล้ว
  useEffect(() => {
    if (!slip) return;
    const channel = supabase
      .channel(`slip-${slip.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "payment_slips", filter: `id=eq.${slip.id}` },
        payload => setSlip(payload.new as PaymentSlip),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [slip?.id]);

  const pick = () => fileRef.current?.click();

  const upload = async (file: File) => {
    setBusy(true);
    const { slip: created, error } = await submitSlip({
      kind, orderId, reservationId, amount, note, file,
    });
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    if (error === "duplicate") {
      toast.error("สลิปนี้ถูกใช้แจ้งโอนไปแล้ว กรุณาแนบสลิปการโอนครั้งล่าสุด");
      return;
    }
    if (error === "invalid") {
      toast.error("กรุณาแนบรูปสลิป (ไฟล์รูปภาพไม่เกิน 5MB)");
      return;
    }
    if (error || !created) {
      toast.error("ส่งสลิปไม่สำเร็จ กรุณาลองอีกครั้ง");
      return;
    }
    setSlip(created);
    toast.success("ส่งสลิปแล้ว รอพนักงานยืนยันสักครู่");
  };

  if (slip) {
    return (
      <div className="w-full rounded-xl border p-3 space-y-2 text-center">
        {slip.status === "pending" && (
          <>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              <Clock className="h-3 w-3 mr-1" /> ส่งสลิปแล้ว — รอพนักงานตรวจสอบ
            </Badge>
            <p className="text-xs text-muted-foreground">
              ระบบตรวจแล้วว่าเป็นสลิปใหม่ ไม่ซ้ำกับที่เคยแจ้ง พนักงานจะกดยืนยันให้ทันทีที่เห็นเงินเข้า
            </p>
          </>
        )}
        {slip.status === "verified" && (
          <>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" /> ยืนยันแล้ว เงินเข้าเรียบร้อย 🎉
            </Badge>
            <p className="text-xs text-muted-foreground">ขอบคุณครับ/ค่ะ</p>
          </>
        )}
        {slip.status === "rejected" && (
          <>
            <Badge className="bg-destructive/10 text-destructive border-destructive/30">
              <XCircle className="h-3 w-3 mr-1" /> สลิปไม่ถูกต้อง
            </Badge>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setSlip(null)}>
              แนบสลิปใหม่
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <Input
        value={note}
        onChange={e => setNote(e.target.value)}
        maxLength={200}
        className="h-9 text-sm"
        placeholder="เวลาโอน / 4 หลักท้ายบัญชี (ไม่บังคับ)"
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }}
      />
      <Button className="w-full" variant="secondary" onClick={pick} disabled={busy}>
        <Upload className="h-4 w-4 mr-2" />
        {busy ? "กำลังตรวจสอบสลิป..." : "โอนแล้ว — แนบสลิปเพื่อยืนยันอัตโนมัติ"}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        ยอดที่ต้องโอน ฿{amount.toLocaleString()} — ระบบจะตรวจสลิปซ้ำและแจ้งพนักงานทันที
      </p>
    </div>
  );
}
