import { supabase } from "@/integrations/supabase/client";
import type { PaymentSlip, PaymentSlipKind } from "@/types/restaurant";

export const SLIP_BUCKET = "payment-slips";

/** ลายนิ้วมือของไฟล์สลิป (SHA-256) ใช้กันการส่งสลิปใบเดิมซ้ำ */
export async function fileHash(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface SubmitSlipInput {
  kind: PaymentSlipKind;
  orderId?: string | null;
  reservationId?: string | null;
  amount: number;
  note?: string;
  file: File;
}

export interface SubmitSlipResult {
  slip: PaymentSlip | null;
  /** 'duplicate' = สลิปใบนี้ถูกใช้ไปแล้ว */
  error: "duplicate" | "invalid" | "failed" | null;
}

const MAX_BYTES = 5 * 1024 * 1024;

/** ส่งสลิปเข้าระบบ: เช็คซ้ำด้วยแฮชไฟล์ แล้วอัปโหลดรูปเก็บไว้ให้พนักงานกดยืนยัน */
export async function submitSlip(input: SubmitSlipInput): Promise<SubmitSlipResult> {
  const { file } = input;
  if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
    return { slip: null, error: "invalid" };
  }

  const hash = await fileHash(file);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
  const path = `${input.kind}/${hash}.${ext}`;

  const { data, error } = await supabase.from("payment_slips").insert({
    kind: input.kind,
    order_id: input.orderId ?? null,
    reservation_id: input.reservationId ?? null,
    amount: input.amount,
    slip_hash: hash,
    storage_path: path,
    note: (input.note ?? "").slice(0, 200),
    status: "pending",
  }).select("*").maybeSingle();

  if (error) {
    if (error.code === "23505" || /duplicate key/i.test(error.message)) {
      return { slip: null, error: "duplicate" };
    }
    return { slip: null, error: "failed" };
  }

  await supabase.storage.from(SLIP_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || undefined,
  });

  return { slip: (data as PaymentSlip) ?? null, error: null };
}

/** ลิงก์ชั่วคราวสำหรับพนักงานเปิดดูรูปสลิป */
export async function slipImageUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(SLIP_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
