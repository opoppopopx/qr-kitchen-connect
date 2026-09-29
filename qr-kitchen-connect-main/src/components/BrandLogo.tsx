import { useBranding, DEFAULT_BRAND_NAME } from "@/contexts/BrandingContext";

export const BRAND_NAME = DEFAULT_BRAND_NAME;

interface BrandLogoProps {
  className?: string;
  size?: number;
  withName?: boolean;
  subtitle?: string;
}

export function BrandLogo({ className = "", size = 28, withName = true, subtitle }: BrandLogoProps) {
  const { name, logoUrl } = useBranding();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoUrl}
        alt={`โลโก้ ${name}`}
        width={size}
        height={size}
        loading="lazy"
        style={{ width: size, height: size }}
        className="shrink-0 object-contain"
      />
      {withName && (
        <span className="leading-tight">
          <span className="block font-semibold text-primary">{name}</span>
          {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
        </span>
      )}
    </div>
  );
}
