import type { ReactNode } from "react";

const TOTAL = 14;

export function SlideFrame({
  section,
  title,
  children,
  source,
  page,
  dark = false,
}: {
  section: string;
  title: ReactNode;
  children: ReactNode;
  source?: string;
  page: string;
  dark?: boolean;
}) {
  return (
    <div
      className={
        "w-screen h-screen overflow-hidden relative font-display " +
        (dark ? "bg-deep text-white" : "bg-bg text-text")
      }
    >
      <div
        className={
          "absolute inset-0 pointer-events-none " +
          (dark ? "blueprint-grid-dark" : "blueprint-grid")
        }
      />
      <div className="relative h-full px-[7vw] pt-[6vh] pb-[4vh] flex flex-col">
        <div className="flex items-center gap-[0.8vw]">
          <div className="w-[2.4vw] h-[0.5vh] klard-gradient" />
          <span className="text-[2.2vw] tracking-[0.26em] font-semibold text-primary">
            {section}
          </span>
        </div>
        <h2
          className={
            "mt-[1.8vh] text-[3.1vw] font-bold tracking-tight leading-[1.12] max-w-[86vw] " +
            (dark ? "text-white" : "text-deep")
          }
        >
          {title}
        </h2>
        <div className="mt-[3vh] flex-1 min-h-0 flex flex-col">{children}</div>
        <div className="mt-[2vh] flex items-end justify-between gap-[2vw]">
          <span
            className={
              "text-[2.2vw] leading-snug max-w-[66vw] " +
              (dark ? "text-white/55" : "text-muted")
            }
          >
            {source ?? ""}
          </span>
          <span
            className={
              "text-[2.2vw] tracking-[0.18em] whitespace-nowrap " +
              (dark ? "text-white/45" : "text-muted")
            }
          >
            {page} / {TOTAL}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Bullet({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <li className="flex gap-[1.2vw] items-start">
      <span className="mt-[1.3vh] w-[0.8vw] h-[0.8vw] flex-none rotate-45 bg-primary" />
      <span
        className={
          "text-[2.6vw] leading-[1.32] " + (dark ? "text-white/85" : "text-text")
        }
      >
        {children}
      </span>
    </li>
  );
}

export function LeadBullet({
  lead,
  children,
}: {
  lead: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-[1.2vw] items-start">
      <span className="mt-[1.3vh] w-[0.8vw] h-[0.8vw] flex-none rotate-45 bg-primary" />
      <span className="text-[2.6vw] leading-[1.32] text-text">
        <span className="font-semibold text-deep">{lead}</span> {children}
      </span>
    </li>
  );
}
