import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Copy, ExternalLink, Globe } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { getPublicBaseUrl, getPublicBaseUrlOverride, setPublicBaseUrl } from "@/lib/publicUrl";

export default function QRCodesPage() {
  const { tables } = useRestaurant();
  const [base, setBase] = useState(getPublicBaseUrl());
  const [draft, setDraft] = useState(getPublicBaseUrlOverride());
  const zones = [...new Set(tables.map(t => t.zone))].sort();

  const urlFor = (id: string) => `${base}/t/${id}`;

  const saveBase = () => {
    setPublicBaseUrl(draft);
    setBase(getPublicBaseUrl());
    toast.success("อัปเดตลิงก์ QR แล้ว");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-2xl font-bold">QR Code ประจำโต๊ะ</h2>
          <p className="text-sm text-muted-foreground">
            พิมพ์แล้ววางที่โต๊ะ ลูกค้าสแกนแล้วเข้าหน้าสั่งอาหารของโต๊ะนั้นโดยตรง
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> พิมพ์ทั้งหมด
        </Button>
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> โดเมนสำหรับลูกค้า (ใช้สแกนจากเครื่องอื่น)
          </p>
          <p className="text-xs text-muted-foreground">
            ใส่โดเมนที่เผยแพร่แล้ว เช่น https://ชื่อร้าน.com เพื่อให้มือถือลูกค้าเปิดได้ทุกเครื่อง
          </p>
          <div className="flex gap-2">
            <Input placeholder={base} value={draft} onChange={e => setDraft(e.target.value)} />
            <Button onClick={saveBase}>บันทึก</Button>
          </div>
          <p className="text-xs text-muted-foreground break-all">ลิงก์ปัจจุบัน: {base}/t/…</p>
        </CardContent>
      </Card>


      {zones.map(zone => (
        <div key={zone} className="space-y-3">
          <h3 className="text-lg font-semibold">โซน {zone}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tables.filter(t => t.zone === zone).map(table => (
              <Card key={table.id} className="break-inside-avoid">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <p className="text-xs text-muted-foreground">สแกนเพื่อสั่งอาหาร</p>
                  <p className="text-xl font-bold">โต๊ะ {table.number}</p>
                  <QRCodeSVG value={urlFor(table.id)} size={160} includeMargin />
                  <p className="text-[10px] break-all text-muted-foreground">{urlFor(table.id)}</p>
                  <div className="flex gap-1 print:hidden">
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(urlFor(table.id)); toast.success("คัดลอกลิงก์แล้ว"); }}>
                      <Copy className="h-3 w-3 mr-1" /> คัดลอก
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open(urlFor(table.id), "_blank")}>
                      <ExternalLink className="h-3 w-3 mr-1" /> ทดสอบ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {tables.length === 0 && <p className="text-muted-foreground">ยังไม่มีโต๊ะในระบบ</p>}
    </div>
  );
}
