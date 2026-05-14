import type { TimelineItem as TItem } from "@/lib/types";

export default function TimelineItem({
  item,
  isLast,
}: {
  item: TItem;
  isLast: boolean;
}) {
  return (
    <>
      {/* Mobile: stacked layout */}
      <div
        className="flex flex-col sm:hidden"
        style={{
          paddingBottom: "20px",
          ...(!isLast && {
            borderBottom: "0.5px solid var(--n100)",
            marginBottom: "20px",
          }),
        }}
      >
        <span
          className="mb-1 font-mono text-[11px]"
          style={{ color: "var(--n400)" }}
        >
          {item.date}
        </span>
        <span
          className="text-sm font-medium"
          style={{ color: "var(--n900)" }}
        >
          {item.title}
        </span>
        <span
          className="text-[12.5px]"
          style={{ color: "var(--n500)" }}
        >
          {item.subtitle}
        </span>
        {item.activeLabel && (
          <span
            className="mt-1 font-mono text-[11px]"
            style={{ color: "var(--accent)" }}
          >
            {item.activeLabel}
          </span>
        )}
      </div>

      {/* Desktop: 3-column grid with dots */}
      <div
        className="hidden sm:grid"
        style={{ gridTemplateColumns: "100px 16px 1fr" }}
      >
        {/* Date */}
        <div className="pt-[2px] text-right">
          <span
            className="font-mono text-[11.5px]"
            style={{ color: "var(--n400)" }}
          >
            {item.date}
          </span>
        </div>

        {/* Dot + connector */}
        <div className="flex flex-col items-center">
          <div
            className="mt-[6px] h-2 w-2 shrink-0 rounded-full"
            style={{
              border: "2px solid var(--accent)",
              background: item.activeLabel ? "var(--accent)" : "var(--card-bg)",
            }}
          />
          {!isLast && (
            <div
              className="flex-1"
              style={{
                width: "0.5px",
                background: "var(--n200)",
              }}
            />
          )}
        </div>

        {/* Content */}
        <div className="pb-6 pl-3">
          <span
            className="block text-sm lg:text-[15px] font-medium"
            style={{ color: "var(--n900)" }}
          >
            {item.title}
          </span>
          <span
            className="block text-[12.5px] lg:text-sm"
            style={{ color: "var(--n500)" }}
          >
            {item.subtitle}
          </span>
          {item.activeLabel && (
            <span
              className="mt-1 inline-block font-mono text-[11px]"
              style={{ color: "var(--accent)" }}
            >
              {item.activeLabel}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
