import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Image as ImageIcon, X } from "lucide-react";
import { slipImageUrl } from "@/lib/paymentSlip";
import type { PaymentSlip } from "@/types/restaurant";
import { slipStatusLabels } from "@/types/restaurant";

const styles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  verified: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

interface Props {
  slips: PaymentSlip[];
  expected?: number;
  onVerify: (slip: PaymentSlip) => void | Promise<void>;
  onReject: (slip: PaymentSlip) => void | Promise<void>;
  busy?: boolean;
}

/** รายการสลิปที่ลูกค้าแจ้งโอน ให้พนักงานเปิดดูรูปและยืนยันในคลิกเดียว */
export function SlipReview({ slips, expected, onVerify, onReject, busy }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!slips.length) return null;

  const view = async (slip: PaymentSlip) => {
    setOpen(true);
    setPreview(null);
    setLoading(true);
    const url = await slipImageUrl(slip.storage_path);
    setPreview(url);
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-2 space-y-2">
      <p className="text-xs font-semibold">สลิปแจ้งโอนจากลูกค้า</p>
      {slips.map(s => (
        <div key={s.id} className="space-y-1 border-b last:border-0 pb-2 last:pb-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(s.created_at).toLocaleString("th-TH")} • ฿{Number(s.amount).toLocaleString()}
              {expected !== undefined && Number(s.amount) !== Number(expected) ? " (ยอดไม่ตรง!)" : ""}
            </span>
            <Badge className={styles[s.status]}>{slipStatusLabels[s.status]}</Badge>
          </div>
          {s.note && <p className="text-xs text-muted-foreground">อ้างอิง: {s.note}</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => view(s)}>
              <ImageIcon className="h-3 w-3 mr-1" /> ดูสลิป
            </Button>
            {s.status === "pending" && (
              <>
                <Button size="sm" disabled={busy} onClick={() => onVerify(s)}>
                  <Check className="h-3 w-3 mr-1" /> เงินเข้าจริง — ยืนยัน
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => onReject(s)}>
                  <X className="h-3 w-3 mr-1" /> สลิปไม่ถูกต้อง
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setPreview(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>สลิปการโอน</DialogTitle></DialogHeader>
          {loading && <p className="text-sm text-muted-foreground">กำลังเปิดรูปสลิป...</p>}
          {!loading && preview && (
            <img src={preview} alt="สลิปการโอนเงินของลูกค้า" className="w-full rounded-lg" />
          )}
          {!loading && !preview && (
            <p className="text-sm text-muted-foreground">
              ไม่พบรูปสลิปของรายการนี้ (ลูกค้าแนบไม่สำเร็จ) กรุณาให้ลูกค้าแนบสลิปใหม่อีกครั้ง
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
