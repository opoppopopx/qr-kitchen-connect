import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/logo.png";

export const DEFAULT_BRAND_NAME = "TableOrder";

interface Branding {
  name: string;
  logoUrl: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<Branding>({
  name: DEFAULT_BRAND_NAME,
  logoUrl: defaultLogo,
  loading: false,
  refresh: async () => {},
});

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [name, setName] = useState(DEFAULT_BRAND_NAME);
  const [logoUrl, setLogoUrl] = useState<string>(defaultLogo);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("restaurant_settings")
      .select("restaurant_name, logo_url")
      .limit(1)
      .maybeSingle();
    const nextName = (data?.restaurant_name || "").trim() || DEFAULT_BRAND_NAME;
    setName(nextName);
    setLogoUrl((data?.logo_url || "").trim() || defaultLogo);
    document.title = `${nextName} — ระบบสั่งอาหารด้วย QR Code`;
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("branding-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_settings" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return (
    <BrandingContext.Provider value={{ name, logoUrl, loading, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
};
