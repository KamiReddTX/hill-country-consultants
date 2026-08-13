import Image from "next/image";

/**
 * Labelled image drop zone. The prototype ships 20+ of these waiting on real
 * photography. Until the client supplies a photo, we render the label as a
 * placeholder; once `src` is provided it becomes a real <Image> and the label
 * lives on as alt text. No photographs of people.
 */
export function ImageSlot({
  label,
  src,
  className = "",
  ratio = "4 / 3",
}: {
  label: string;
  src?: string;
  className?: string;
  ratio?: string;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden border border-line-warm ${className}`} style={{ aspectRatio: ratio }}>
        <Image src={src} alt={label} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-center border border-dashed border-line-warm bg-cream/60 p-6 text-center ${className}`}
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={label}
    >
      <span className="font-inter text-[13px] leading-snug text-ink-faint">{label}</span>
    </div>
  );
}
