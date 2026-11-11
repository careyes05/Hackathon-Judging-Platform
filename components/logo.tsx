import Link from "next/link";
import type { LogoSlot } from "@/lib/site-config";

/**
 * Renders one logo slot from `siteConfig.logos`, or nothing when the slot is
 * null. Plain <img> on purpose: club logos arrive at whatever size they
 * arrive at, and next/image would force everyone to look up exact pixel
 * dimensions before a logo would appear at all.
 */
export default function Logo({
  slot,
  className = "",
}: {
  slot: LogoSlot;
  className?: string;
}) {
  if (!slot) return null;
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={slot.src}
      alt={slot.alt}
      height={slot.height}
      style={{ height: slot.height, width: "auto" }}
      className={`logo-img ${className}`.trim()}
    />
  );
  if (slot.href) {
    return (
      <Link href={slot.href} className="logo-link">
        {image}
      </Link>
    );
  }
  return image;
}

export function LogoRow({
  slots,
  label,
}: {
  slots: readonly NonNullable<LogoSlot>[];
  label?: string;
}) {
  if (!slots.length) return null;
  return (
    <div className="logo-row">
      {label ? <span className="logo-row-label">{label}</span> : null}
      <div className="logo-row-items">
        {slots.map((slot) => (
          <Logo key={slot.src} slot={slot} />
        ))}
      </div>
    </div>
  );
}
