import { Metadata } from "next";
import PageContainer from "../components/PageContainer";
import PageHero from "../components/PageHero";
import { SITE_CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  title: "Work | Walker Sutton",
  description:
    "Software engineering services — websites, web apps, and custom tools.",
};

const SERVICES = [
  {
    id: "websites",
    label: "01",
    title: "Website building",
    description:
      "Clean, fast websites for professionals and small businesses. I handle everything from design to launch — built to be easy to maintain and update.",
    details: [
      "Portfolio & personal sites",
      "Business & landing pages",
      "Blog & content sites",
      "Custom CMS integration",
    ],
    examples: [
      {
        name: "Vard",
        type: "No-code website builder for professional practices",
        href: "https://vard.app",
      },
      {
        name: "The Inn at Orient",
        type: "Hospitality booking & presence site",
        href: "#",
      },
    ],
  },
  {
    id: "apps",
    label: "02",
    title: "App building",
    description:
      "Web apps, tools, and internal software. I work well in the early stages — scoping, building, and shipping quickly without overengineering.",
    details: [
      "Web apps & dashboards",
      "Browser extensions",
      "Scripts & automation",
      "API integrations",
    ],
    examples: [
      {
        name: "Cyclemetry",
        type: "Cycling telemetry overlay tool",
        href: "https://github.com/walkersutton/cyclemetry",
      },
      {
        name: "tog",
        type: "Browser extension · 1,000+ users",
        href: "https://chromewebstore.google.com/detail/pfemfkpbkkcgdmimaicpfbmhfjcefijn",
      },
      {
        name: "Cadence Calculator",
        type: "Strava API integration",
        href: "https://github.com/walkersutton/cadence-calculator",
      },
    ],
  },
];

export default function ServicesPage() {
  return (
    <PageContainer>
      <PageHero eyebrow="Available for projects">
        I build things for people.
      </PageHero>

      <div className="mt-16 flex flex-col">
        {SERVICES.map((service) => (
          <div
            key={service.id}
            className="py-14"
            style={{ borderTop: "1px solid var(--color-rule)" }}
          >
            <div
              className="grid gap-10 items-start"
              style={{ gridTemplateColumns: "1fr 1.2fr" }}
            >
              {/* Left */}
              <div>
                <div
                  className="text-[12px] font-semibold uppercase tracking-[0.14em] mb-4"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  {service.label}
                </div>
                <h2
                  className="text-[clamp(22px,3vw,32px)] font-semibold tracking-[-0.02em] leading-[1.1] mb-4 mt-0"
                  style={{ color: "var(--color-text)" }}
                >
                  {service.title}
                </h2>
                <p
                  className="text-[16px] leading-[1.65] mb-6 max-w-[42ch]"
                  style={{ color: "var(--color-text-variant)" }}
                >
                  {service.description}
                </p>
                <ul className="pd-details">
                  {service.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>

              {/* Right: example work */}
              <div>
                <div
                  className="text-[12px] font-semibold uppercase tracking-[0.14em] mb-4"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  Example work
                </div>
                <div className="flex flex-col">
                  {service.examples.map((ex) => {
                    const isSoon = ex.href === "#";
                    const row = (
                      <div
                        className="flex items-baseline justify-between gap-4 py-4"
                        style={{
                          borderBottom: "1px solid var(--color-border-faint)",
                        }}
                      >
                        <span
                          className={`text-[17px] font-semibold tracking-[-0.015em]${isSoon ? "" : " group-hover:underline"}`}
                          style={{
                            color: "var(--color-text)",
                            textDecorationColor: "var(--accent)",
                            textDecorationThickness: 2,
                            textUnderlineOffset: 3,
                          }}
                        >
                          {ex.name}
                        </span>
                        <span
                          className="text-[13.5px] text-right shrink-0"
                          style={{ color: "var(--color-text-faint)" }}
                        >
                          {ex.type}
                        </span>
                      </div>
                    );
                    return isSoon ? (
                      <div key={ex.name}>{row}</div>
                    ) : (
                      <a
                        key={ex.name}
                        href={ex.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline group"
                        style={{ color: "inherit" }}
                      >
                        {row}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="mt-4 pt-12 pb-16"
        style={{ borderTop: "1px solid var(--color-rule)" }}
      >
        <p
          className="text-[clamp(28px,4vw,48px)] font-semibold tracking-[-0.025em] leading-[1.1] max-w-[18ch]"
          style={{ color: "var(--color-text)" }}
        >
          Have something to build?{" "}
          <a
            href="mailto:walker@walkersutton.com"
            className="no-underline hover:underline"
            style={{ color: "var(--accent)", textUnderlineOffset: "5px" }}
          >
            Say hello →
          </a>
        </p>
        <p
          className="mt-4 text-[15px]"
          style={{ color: "var(--color-text-faint)" }}
        >
          walker@walkersutton.com · {SITE_CONFIG.city}
        </p>
      </div>
    </PageContainer>
  );
}
