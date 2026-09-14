import type { Isp } from "@/lib/plans";
import { cn } from "@/lib/utils";
import dialogLogo from "@/assets/isps/dialog.png";
import hutchLogo from "@/assets/isps/hutch.jpg";
import mobitelLogo from "@/assets/isps/mobitel.png";
import sltLogo from "@/assets/isps/slt.png";
import airtelLogo from "@/assets/isps/airtel.png";

export const ISP_LOGOS: Record<Isp, string> = {
  Dialog: dialogLogo,
  Hutch: hutchLogo,
  Mobitel: mobitelLogo,
  SLT: sltLogo,
  Airtel: airtelLogo,
};

/**
 * Brand logo rendered on a white chip so official brand colors stay
 * accurate in both light and dark themes.
 */
export function IspLogo({
  isp,
  className,
  imgClassName,
}: {
  isp: string;
  className?: string;
  imgClassName?: string;
}) {
  const src = ISP_LOGOS[isp as Isp];
  if (!src) {
    return (
      <span className={cn("font-display text-xs font-bold uppercase tracking-wider", className)}>
        {isp}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-9 w-16 items-center justify-center overflow-hidden rounded-lg bg-white px-1.5 py-1 shadow-sm",
        className
      )}
    >
      <img
        src={src}
        alt={`${isp} logo`}
        loading="lazy"
        className={cn("max-h-full max-w-full object-contain", imgClassName)}
      />
    </span>
  );
}
