import { supabase } from "@/integrations/supabase/client";

export const MENU_BUCKET = "menu-images";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export const isImageUrl = (v?: string | null) =>
  !!v && (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("blob:"));

export async function uploadMenuImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(MENU_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from(MENU_BUCKET)
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data?.signedUrl) throw signErr ?? new Error("ไม่สามารถสร้างลิงก์รูปได้");
  return data.signedUrl;
}
