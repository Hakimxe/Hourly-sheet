type LogoProps = {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "mark";
  light?: boolean;
};

const sizes = {
  sm: { mark: 32, text: "text-sm" },
  md: { mark: 40, text: "text-base" },
  lg: { mark: 56, text: "text-xl" },
};

export default function Logo({
  size = "md",
  variant = "full",
  light = false,
}: LogoProps) {
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5 group select-none">
      <div
        className="relative grid place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30 transition-transform duration-500 group-hover:rotate-[10deg] group-hover:scale-105"
        style={{ height: s.mark, width: s.mark }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          width={s.mark * 0.55}
          height={s.mark * 0.55}
          fill="none"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Stylized clock hand + spark — represents tracking time creatively */}
          <circle cx="12" cy="12" r="9" opacity="0.35" />
          <path d="M12 7v5l3.5 2" />
          <circle cx="12" cy="12" r="1.4" fill="white" stroke="none" />
        </svg>
        <span
          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-white border-2 border-orange-500 animate-pulse"
          aria-hidden
        />
      </div>
      {variant === "full" && (
        <div className="leading-tight">
          <p
            className={`font-semibold tracking-tight ${s.text} ${
              light ? "text-white" : "text-slate-900"
            }`}
          >
            Creator
            <span className={light ? "text-amber-200" : "text-orange-500"}>
              Hours
            </span>
          </p>
          <p
            className={`text-[10px] uppercase tracking-[0.18em] ${
              light ? "text-orange-100" : "text-slate-400"
            }`}
          >
            Track · Confirm · Done
          </p>
        </div>
      )}
    </div>
  );
}
