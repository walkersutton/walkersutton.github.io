import { fmtDayHeading, fmtTime, type ReportDay } from "@/lib/trip-report";

/**
 * The day-by-day body of a trip report, shared by the live feed at
 * /trips/live/report and the archived copy at /trips/<slug>/report.
 *
 * One component rather than two so an archived trip reads exactly as it did on
 * the day — the whole point of keeping it is that it is the same thing readers
 * already saw, and two copies of this markup would drift the first time either
 * page was touched.
 */
export default function ReportEntries({ days }: { days: ReportDay[] }) {
  return (
    <div className="flex flex-col">
      {days.map((day) => (
        <section
          key={day.key}
          style={{
            borderTop: "1px solid var(--color-border-faint)",
            paddingTop: 28,
            marginTop: 28,
          }}
        >
          <h2
            className="text-[13px] font-semibold uppercase tracking-[0.11em]"
            style={{ color: "var(--color-text-faint)", marginBottom: 18 }}
          >
            {fmtDayHeading(day.entries[0])}
          </h2>

          {day.entries.map((entry) => (
            <div key={entry.id} style={{ marginBottom: 28 }}>
              <div
                className="text-[11px] font-medium tracking-[0.02em]"
                style={{ color: "var(--color-text-faint)", marginBottom: 8 }}
              >
                {fmtTime(entry)}
              </div>
              {entry.text && (
                <p
                  className="text-[16px] leading-[1.7] mb-[16px]"
                  style={{
                    color: "var(--color-text)",
                    maxWidth: "64ch",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {entry.text}
                </p>
              )}
              {entry.images.length > 0 && (
                <div className="flex flex-col gap-[12px]">
                  {entry.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt=""
                      // A trip's report grows without bound, and every photo on
                      // it is a Blob download. Only pay for the ones a reader
                      // actually scrolls to.
                      loading="lazy"
                      decoding="async"
                      className="w-full"
                      style={{ borderRadius: 6, maxWidth: "100%", height: "auto" }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
