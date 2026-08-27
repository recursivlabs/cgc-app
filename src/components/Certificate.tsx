import Image from "next/image";

/**
 * The reward for taking an action: a card with your name and your number on
 * it. Used for #BridgeBuilder membership and for the Philadelphia Declaration.
 */
export default function Certificate({
  name,
  number,
  label,
  title,
  line,
  date,
}: {
  name: string;
  number: number;
  label: string;
  title: string;
  line: string;
  date?: string;
}) {
  const stamped =
    date ||
    new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="cert">
      <div className="cert-inner">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={34} height={34} className="h-[34px] w-[34px]" />
            <span className="display text-sm tracking-wide">
              COMMON<span className="text-[var(--signal)]">GROUND</span>CAMPUS
            </span>
          </div>
          <span className="cert-no">No. {number}</span>
        </div>

        <p className="eyebrow mt-9">{label}</p>
        <p className="display mt-3 text-[clamp(1.9rem,5.2vw,3.1rem)] leading-[0.95]">{name}</p>

        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--ink-dim)]">{line}</p>

        <div className="mt-9 flex items-end justify-between gap-4 border-t border-[var(--line)] pt-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
            {title}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
            {stamped}
          </span>
        </div>
      </div>
    </div>
  );
}
