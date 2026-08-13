/** Heading + the thin gold rule, used across marketing pages. */
export function SectionHeading({
  kicker,
  title,
  intro,
  as = "h2",
}: {
  kicker?: string;
  title: string;
  intro?: string;
  as?: "h1" | "h2";
}) {
  const Tag = as;
  return (
    <div className="max-w-[46em]">
      {kicker ? <p className="kicker mb-4">{kicker}</p> : null}
      <Tag
        className={`font-fraunces font-normal leading-tight text-forest ${
          as === "h1" ? "text-[clamp(34px,5vw,52px)]" : "text-[clamp(28px,3.6vw,38px)]"
        }`}
      >
        {title}
      </Tag>
      <span className="rule-gold mt-3" />
      {intro ? <p className="mt-6 text-[18px] prose-soft">{intro}</p> : null}
    </div>
  );
}
