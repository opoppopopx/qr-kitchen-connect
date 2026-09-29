import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSoundOn, onSoundChange, playSound, setSoundOn } from "@/lib/sound";

/** สถานะเปิด/ปิดเสียงแจ้งเตือน ใช้ร่วมกันทุกหน้า */
export function useSoundEnabled() {
  const [on, setOn] = useState(isSoundOn);
  useEffect(() => onSoundChange(setOn), []);
  return on;
}

interface Props {
  /** ย่อเป็นปุ่มไอคอนเดียว (เหมาะกับหน้าจอเล็ก/จอครัว) */
  compact?: boolean;
  className?: string;
}

/** ปุ่มเปิด/ปิดเสียงแจ้งเตือนชั่วคราว */
export function SoundToggle({ compact, className }: Props) {
  const on = useSoundEnabled();

  const toggle = () => {
    const next = !on;
    setSoundOn(next);
    if (next) playSound("newOrder");
  };

  return (
    <Button
      size={compact ? "icon" : "sm"}
      variant="outline"
      className={className}
      onClick={toggle}
      aria-label={on ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
      title={on ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
    >
      {on ? <Volume2 className={compact ? "h-4 w-4" : "h-4 w-4 mr-2"} /> : <VolumeX className={compact ? "h-4 w-4" : "h-4 w-4 mr-2"} />}
      {!compact && (on ? "เสียงแจ้งเตือน: เปิด" : "เสียงแจ้งเตือน: ปิด")}
    </Button>
  );
}
