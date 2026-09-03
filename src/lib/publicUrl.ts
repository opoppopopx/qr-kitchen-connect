const OVERRIDE_KEY = "qr_public_base_url";

/** Base URL ที่ลูกค้าเครื่องอื่นเปิดได้จริง (ไม่ใช่ URL ของ preview/localhost) */
export function getPublicBaseUrl(): string {
  const override = typeof localStorage !== "undefined" ? localStorage.getItem(OVERRIDE_KEY) : null;
  if (override) return override.replace(/\/+$/, "");

  const { origin, hostname, protocol, port } = window.location;

  // ลิงก์ preview เปิดได้เฉพาะเจ้าของโปรเจกต์ -> ใช้โดเมนสาธารณะแทน
  if (hostname.includes("id-preview--")) {
    return `${protocol}//${hostname.replace(/^id-preview--/, "")}`;
  }

  // dev บนเครื่อง: ใช้ IP ของเครื่องเพื่อให้มือถือในวง LAN เดียวกันเปิดได้
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
  }

  return origin;
}

export function setPublicBaseUrl(url: string) {
  const clean = url.trim().replace(/\/+$/, "");
  if (clean) localStorage.setItem(OVERRIDE_KEY, clean);
  else localStorage.removeItem(OVERRIDE_KEY);
}

export function getPublicBaseUrlOverride(): string {
  return (typeof localStorage !== "undefined" && localStorage.getItem(OVERRIDE_KEY)) || "";
}

export function tableOrderUrl(tableId: string): string {
  return `${getPublicBaseUrl()}/t/${tableId}`;
}
