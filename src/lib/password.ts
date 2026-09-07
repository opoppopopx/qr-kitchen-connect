// ผู้ใช้สามารถตั้งรหัสผ่านสั้นแค่ไหนก็ได้ (แม้แต่ 1 ตัว)
// ระบบยืนยันตัวตนเบื้องหลังต้องการอย่างน้อย 6 ตัวอักษร
// จึงเติมความยาวให้ครบแบบคงที่ทั้งตอนตั้งรหัสและตอนเข้าสู่ระบบ
export const PASSWORD_PAD = "·";
export const MIN_BACKEND_PASSWORD_LENGTH = 6;

export function normalizePassword(password: string): string {
  if (password.length >= MIN_BACKEND_PASSWORD_LENGTH) return password;
  return password.padEnd(MIN_BACKEND_PASSWORD_LENGTH, PASSWORD_PAD);
}
