import { useRestaurant } from "@/contexts/RestaurantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRef, useState } from "react";
import { Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/restaurant";
import { useAuth } from "@/contexts/AuthContext";
import { isImageUrl, uploadMenuImage } from "@/lib/menuImage";


interface Draft {
  name: string; price: string; image: string; category_id: string; description: string; available: boolean;
}

const emptyDraft: Draft = { name: "", price: "", image: "🍲", category_id: "", description: "", available: true };

export default function MenuManagementPage() {
  const { categories, products, toggleProductAvailability, addProduct, updateProduct, deleteProduct } = useRestaurant();
  const { role } = useAuth();
  const canUploadImage = role === "admin" || role === "manager";
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const filtered = selectedCat === "all" ? products : products.filter(p => p.category_id === selectedCat);

  const pickImage = async (file?: File | null) => {
    if (!file) return;
    if (!canUploadImage) { toast.error("เฉพาะแอดมินและผู้จัดการเท่านั้นที่ใส่รูปได้"); return; }
    if (!file.type.startsWith("image/")) { toast.error("กรุณาเลือกไฟล์รูปภาพ"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ใหญ่เกิน 5MB"); return; }
    setUploading(true);
    try {
      const url = await uploadMenuImage(file);
      setDraft(d => ({ ...d, image: url }));
      toast.success("อัปโหลดรูปแล้ว");
    } catch {
      toast.error("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };


  const openNew = () => {
    setEditId(null);
    setDraft({ ...emptyDraft, category_id: categories[0]?.id ?? "" });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setDraft({
      name: p.name, price: String(Number(p.price)), image: p.image,
      category_id: p.category_id ?? "", description: p.description, available: p.available,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) { toast.error("กรุณากรอกชื่อเมนู"); return; }
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price < 0) { toast.error("ราคาไม่ถูกต้อง"); return; }
    if (!draft.category_id) { toast.error("กรุณาเลือกหมวดหมู่"); return; }
    const payload = {
      name: draft.name.trim(),
      price,
      image: draft.image || "🍲",
      category_id: draft.category_id,
      description: draft.description.trim(),
      available: draft.available,
    };
    if (editId) await updateProduct(editId, payload);
    else await addProduct(payload);
    toast.success(editId ? "แก้ไขเมนูแล้ว" : "เพิ่มเมนูใหม่แล้ว");
    setOpen(false);
  };

  const remove = async (p: Product) => {
    await deleteProduct(p.id);
    toast.success("ลบเมนูแล้ว");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">จัดการเมนูอาหาร</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> เพิ่มเมนูใหม่</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={selectedCat === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedCat("all")}>
          ทั้งหมด
        </Button>
        {categories.map(cat => (
          <Button key={cat.id} variant={selectedCat === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(cat.id)}>
            {cat.icon} {cat.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(product => (
          <Card key={product.id} className={`transition-all ${!product.available ? 'opacity-60' : ''}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{product.image}</span>
                  <div>
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                    <p className="text-primary font-bold mt-1">฿{Number(product.price)}</p>
                  </div>
                </div>
                <Badge variant={product.available ? "default" : "destructive"}>
                  {product.available ? 'มีของ' : 'หมด'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">เปิดขาย</span>
                  <Switch
                    checked={product.available}
                    onCheckedChange={v => toggleProductAvailability(product.id, v)}
                  />
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => openEdit(product)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(product)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">ยังไม่มีเมนูในหมวดนี้</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>ชื่อเมนู</Label>
              <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>ราคา (บาท)</Label>
                <Input type="number" value={draft.price} onChange={e => setDraft(d => ({ ...d, price: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>ไอคอน / อีโมจิ</Label>
                <Input value={draft.image} onChange={e => setDraft(d => ({ ...d, image: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>หมวดหมู่</Label>
              <Select value={draft.category_id} onValueChange={v => setDraft(d => ({ ...d, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>รายละเอียด</Label>
              <Input value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={draft.available} onCheckedChange={v => setDraft(d => ({ ...d, available: v }))} />
              <span className="text-sm">เปิดขาย</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
