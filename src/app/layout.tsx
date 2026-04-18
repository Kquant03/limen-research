import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Source_Serif_4,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import LivingSubstrate from "@/components/LivingSubstrate";
import SiteHeader from "@/components/SiteHeader";
import LimenLoader from "@/components/LimenLoader";
import Link from "next/link";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Body reading serif — replaces DM Sans. Source Serif 4 is Adobe's
// open-source screen-reading serif, designed for exactly this kind of
// long-form academic prose. Pairs with Cormorant Garamond: same classical
// skeleton, different roles — display carries the drama, body does the
// patient work of paragraphs.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://limenresearch.ai"),
  title: {
    default: "Limen Research",
    template: "%s · Limen Research",
  },
  description:
    "An independent research organization studying the architectural primitives of minds, artificial life, and alignment. Publications, platforms, and open data from Toledo, Ohio.",
  openGraph: {
    title: "Limen Research",
    description:
      "Intelligence organizes around substrate coupling and integrative depth, not extraction and expansion.",
    url: "https://limenresearch.ai",
    siteName: "Limen Research",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Limen Research",
    description:
      "Intelligence organizes around substrate coupling and integrative depth, not extraction and expansion.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${sourceSerif.variable} ${jetbrains.variable}`}
    >
      <body
        style={{
          background: "#010106",
          color: "#c8cfe0",
          fontFamily:
            "var(--font-body), 'Source Serif 4', Georgia, 'Times New Roman', serif",
          fontWeight: 400,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <LimenLoader />

        <LivingSubstrate />

        <div
          className="fixed inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 110% 90% at 50% 40%, transparent 0%, rgba(1,1,6,0.55) 70%, #010106 100%)",
          }}
        />

        <div
          className="fixed inset-0 z-[1] pointer-events-none opacity-[0.025] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />

        <SiteHeader />

        <main style={{ position: "relative", zIndex: 2 }}>{children}</main>

        <footer
          style={{
            position: "relative",
            zIndex: 2,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            marginTop: 96,
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              padding: "80px 32px 20px",
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 40,
            }}
          >
            <div style={{ gridColumn: "span 5" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display), serif",
                    fontWeight: 300,
                    fontStyle: "italic",
                    fontSize: 34,
                    color: "#eaeef7",
                  }}
                >
                  Limen
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    letterSpacing: "0.48em",
                    textTransform: "uppercase",
                    color: "#7fafb3",
                  }}
                >
                  Research
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 18,
                  lineHeight: 1.5,
                  color: "#8a9bba",
                  maxWidth: "36ch",
                }}
              >
                An independent research organization studying what persists,
                what couples, and what passes through.
              </p>
              <div
                style={{
                  marginTop: 32,
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#5a6780",
                  lineHeight: 2.2,
                }}
              >
                Toledo · Ohio
                <br />
                Est. <span style={{ color: "#8a9bba" }}>mmxxiv</span>
              </div>
            </div>

            <FooterCol title="Organization">
              <FooterLink href="/about">About</FooterLink>
              <FooterLink href="/research">Research</FooterLink>
              <FooterLink href="mailto:stanley@limenresearch.ai" raw>
                Contact
              </FooterLink>
            </FooterCol>

            <FooterCol title="Elsewhere">
              <FooterLink href="https://github.com/Kquant03" raw external>
                GitHub
              </FooterLink>
              <FooterLink
                href="https://huggingface.co/Replete-AI"
                raw
                external
              >
                Hugging Face
              </FooterLink>
              <FooterLink
                href="https://kquant03.github.io/genesis-phase-transition/"
                raw
                external
              >
                Genesis
              </FooterLink>
            </FooterCol>
          </div>

          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px" }}>
            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
              }}
            />
          </div>

          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              padding: "22px 32px 28px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: "#3a4560",
            }}
          >
            <div>© mmxxvi Limen Research</div>
            <div style={{ textAlign: "center" }}>
              Set in Cormorant Garamond · Source Serif 4 · JetBrains Mono
            </div>
            <div>Successor to Replete AI</div>
          </div>
        </footer>

        <style>{`
          .footer-link:hover { color: #7fafb3 !important; }
        `}</style>
      </body>
    </html>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ gridColumn: "span 3" }}>
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 9,
          letterSpacing: "0.42em",
          textTransform: "uppercase",
          color: "#3a4560",
          paddingBottom: 12,
          marginBottom: 20,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {title}
      </div>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.12em",
          color: "#8a9bba",
        }}
      >
        {children}
      </ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  raw,
  external,
}: {
  href: string;
  children: React.ReactNode;
  raw?: boolean;
  external?: boolean;
}) {
  const Cls = "footer-link";
  const style = { color: "inherit", textDecoration: "none" } as const;

  const content = (
    <>
      {children}
      {external && (
        <span style={{ color: "#3a4560", marginLeft: 8 }} aria-hidden>
          ↗
        </span>
      )}
    </>
  );

  return (
    <li>
      {raw ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className={Cls}
          style={style}
        >
          {content}
        </a>
      ) : (
        <Link href={href} className={Cls} style={style}>
          {content}
        </Link>
      )}
    </li>
  );
}
