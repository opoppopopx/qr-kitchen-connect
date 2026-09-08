/**
 * เสียงแจ้งเตือนสั้นๆ ในระบบ (สร้างจาก Web Audio API ไม่ต้องโหลดไฟล์เสียง)
 * เปิด/ปิดได้ และจำค่าไว้ในเครื่องผู้ใช้
 */

export type SoundKind = "newOrder" | "newReservation" | "foodReady" | "slip" | "paid";

const STORAGE_KEY = "tableorder.sound";
const EVENT = "tableorder-sound-change";

export const isSoundOn = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
};

export const setSoundOn = (on: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: on }));
};

export const onSoundChange = (cb: (on: boolean) => void) => {
  const handler = () => cb(isSoundOn());
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};

type Note = { freq: number; at: number; dur: number; gain?: number; type?: OscillatorType };

/** โน้ตสั้นๆ ของแต่ละเหตุการณ์ — เบาและไม่รบกวน */
const PATTERNS: Record<SoundKind, Note[]> = {
  // ออร์เดอร์ใหม่: ตุ๊ง-ตุ๊ง สองครั้ง
  newOrder: [
    { freq: 880, at: 0, dur: 0.16 },
    { freq: 1175, at: 0.18, dur: 0.18 },
  ],
  // จองโต๊ะใหม่: สามเสียงไล่ขึ้นเบาๆ
  newReservation: [
    { freq: 660, at: 0, dur: 0.13 },
    { freq: 880, at: 0.14, dur: 0.13 },
    { freq: 1046, at: 0.28, dur: 0.2 },
  ],
  // อาหารเสร็จ (หน้าลูกค้า): กระดิ่งใส
  foodReady: [
    { freq: 1046, at: 0, dur: 0.18 },
    { freq: 1568, at: 0.16, dur: 0.26, gain: 0.18 },
  ],
  // ลูกค้าแนบสลิป: จิ๊ง-จิ๊ง สั้นมาก
  slip: [
    { freq: 1320, at: 0, dur: 0.1, gain: 0.16 },
    { freq: 1320, at: 0.13, dur: 0.12, gain: 0.16 },
  ],
  // ยืนยันชำระเงินสำเร็จ: เสียงยืนยันไล่ขึ้น
  paid: [
    { freq: 784, at: 0, dur: 0.12 },
    { freq: 988, at: 0.1, dur: 0.12 },
    { freq: 1319, at: 0.2, dur: 0.24 },
  ],
};

let ctx: AudioContext | null = null;

const getCtx = () => {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx || ctx.state === "closed") ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
};

/** เล่นเสียงแจ้งเตือน (ไม่ทำอะไรถ้าผู้ใช้ปิดเสียงไว้) */
export const playSound = (kind: SoundKind) => {
  if (!isSoundOn()) return;
  try {
    const audio = getCtx();
    if (!audio) return;
    const now = audio.currentTime + 0.02;
    PATTERNS[kind].forEach(n => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = n.type ?? "sine";
      osc.frequency.value = n.freq;
      const peak = n.gain ?? 0.2;
      const start = now + n.at;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + n.dur + 0.02);
    });
  } catch {
    /* ignore audio errors */
  }
};
