import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding, DEFAULT_BRAND_NAME } from "@/contexts/BrandingContext";
import { uploadMenuImage } from "@/lib/menuImage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUp, Loader2, RotateCcw, Save, Store } from "lucide-react";
import { toast } from "sonner";
import defaultLogo from "@/assets/logo.png";

export default function SettingsPage() {
  const { role } = useAuth();
  const { name, logoUrl, refresh } = useBranding();
  const canEdit = role === "admin" || role === "manager";

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [logo, setLogo] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("restaurant_settings").select("id").limit(1).maybeSingle()
      .then(({ data }) => setSettingsId(data?.id ?? null));
  }, []);

  useEffect(() => {
    setShopName(name);
    setLogo(logoUrl === defaultLogo ? "" : logoUrl);
  }, [name, logoUrl]);

  const pickLogo = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("กรุณาเลือกไฟล์รูปภาพ"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ใหญ่เกิน 5MB"); return; }
    setUploading(true);
    try {
      const url = await uploadMenuImage(file);
      setLogo(url);
      toast.success("อัปโหลดโลโก้แล้ว กด “บันทึก” เพื่อใช้งาน");
    } catch (e) {
      toast.error("อัปโหลดไม่สำเร็จ: " + (e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    const trimmed = shopName.trim();
    if (!trimmed) { toast.error("กรุณากรอกชื่อร้าน"); return; }
    if (trimmed.length > 60) { toast.error("ชื่อร้านยาวเกินไป (ไม่เกิน 60 ตัวอักษร)"); return; }
    setSaving(true);
    const payload = { restaurant_name: trimmed, logo_url: logo };
    const { error } = settingsId
      ? await supabase.from("restaurant_settings").update(payload).eq("id", settingsId)
      : await supabase.from("restaurant_settings").insert(payload);
    setSaving(false);
    if (error) { toast.error("บันทึกไม่สำเร็จ: " + error.message); return; }
    await refresh();
    toast.success("บันทึกชื่อร้านและโลโก้แล้ว");
  };

  const preview = logo || defaultLogo;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" /> ตั้งค่าร้าน
        </h2>
        <p className="text-sm text-muted-foreground">
          ชื่อร้านและโลโก้จะแสดงทุกหน้า รวมถึงหน้าสั่งอาหารและหน้าจองของลูกค้า
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">ชื่อร้านและโลโก้</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <img
              src={preview}
              alt={`โลโก้ ${shopName || DEFAULT_BRAND_NAME}`}
              className="h-20 w-20 rounded-lg border object-contain bg-muted/40 p-1"
            />
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) pickLogo(f); }}
              />
              <Button
                variant="outline"
                disabled={!canEdit || uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> กำลังอัปโหลด…</>
                  : <><ImageUp className="h-4 w-4 mr-2" /> เลือกรูปโลโก้</>}
              </Button>
              {logo && canEdit && (
                <Button variant="ghost" size="sm" className="ml-2" onClick={() => setLogo("")}>
                  <RotateCcw className="h-4 w-4 mr-2" /> ใช้โลโก้เริ่มต้น
                </Button>
              )}
              <p className="text-xs text-muted-foreground">ไฟล์รูปภาพ ไม่เกิน 5MB • แนะนำรูปสี่เหลี่ยมจัตุรัส</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop-name">ชื่อร้าน</Label>
            <Input
              id="shop-name"
              value={shopName}
              maxLength={60}
              disabled={!canEdit}
              placeholder={DEFAULT_BRAND_NAME}
              onChange={e => setShopName(e.target.value)}
            />
          </div>

          {canEdit ? (
            <Button onClick={save} disabled={saving}>
              {saving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> กำลังบันทึก…</>
                : <><Save className="h-4 w-4 mr-2" /> บันทึก</>}
            </Button>
          ) : (
            <p className="text-sm text-destructive">
              เฉพาะแอดมินและผู้จัดการเท่านั้นที่แก้ไขชื่อร้านและโลโก้ได้
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
