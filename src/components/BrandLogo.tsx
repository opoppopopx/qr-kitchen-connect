import logo from "@/assets/logo.png";

export const BRAND_NAME = "TableOrder";

interface BrandLogoProps {
  className?: string;
  size?: number;
  withName?: boolean;
  subtitle?: string;
}

export function BrandLogo({ className = "", size = 28, withName = true, subtitle }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logo}
        alt={`โลโก้ ${BRAND_NAME}`}
        width={size}
        height={size}
        loading="lazy"
        style={{ width: size, height: size }}
        className="shrink-0 object-contain"
      />
      {withName && (
        <span className="leading-tight">
          <span className="block font-semibold text-primary">{BRAND_NAME}</span>
          {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
        </span>
      )}
    </div>
  );
}
