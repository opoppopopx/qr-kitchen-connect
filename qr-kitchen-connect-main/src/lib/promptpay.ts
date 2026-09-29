/** สร้าง payload มาตรฐาน EMVCo สำหรับ QR พร้อมเพย์ (PromptPay) */

function f(id: string, value: string) {
  return id + String(value.length).padStart(2, "0") + value;
}

function crc16(data: string) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** แปลงเบอร์โทร / เลขบัตรประชาชน / e-Wallet ให้เป็นรูปแบบพร้อมเพย์ */
function targetField(rawId: string) {
  const id = rawId.replace(/[^0-9]/g, "");
  if (id.length === 13) return f("02", id); // เลขบัตรประชาชน / นิติบุคคล
  if (id.length === 15) return f("03", id); // e-Wallet
  // เบอร์โทร -> 0066xxxxxxxxx
  const phone = ("0000000000000" + id.replace(/^0/, "66")).slice(-13);
  return f("01", phone);
}

export function promptPayPayload(promptpayId: string, amount: number): string {
  if (!promptpayId.replace(/[^0-9]/g, "")) return "";
  const merchant = f("29", f("00", "A000000677010111") + targetField(promptpayId));
  const withAmount = amount > 0 ? f("54", amount.toFixed(2)) : "";
  const body =
    f("00", "01") +
    f("01", amount > 0 ? "12" : "11") +
    merchant +
    f("53", "764") +
    withAmount +
    f("58", "TH");
  const payload = body + "6304";
  return payload + crc16(payload);
}
