import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Limen Research is an independent research organization of one, based in Toledo, Ohio, studying the architectural primitives of minds, artificial life, and alignment.",
};

// ═══════════════════════════════════════════════════════════════════════════
// TOKENS
// ═══════════════════════════════════════════════════════════════════════════

const COLOR = {
  void: "#010106",
  ink: "#f4f6fb",
  inkStrong: "#eaeef7",
  inkBody: "#c8cfe0",
  inkMuted: "#8a9bba",
  inkFaint: "#5a6780",
  inkGhost: "#3a4560",
  ghost: "#7fafb3",
  ghostSoft: "#5d8a8e",
} as const;

const FONT = {
  display: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
  body: "var(--font-body), 'Source Serif 4', Georgia, 'Times New Roman', serif",
  mono: "var(--font-mono), 'JetBrains Mono', monospace",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

function TaperedRule({ accent = false }: { accent?: boolean }) {
  return (
    <div
      style={{
        height: 1,
        background: accent
          ? "linear-gradient(90deg, transparent 0%, rgba(127,175,179,0.05) 12%, rgba(127,175,179,0.38) 50%, rgba(127,175,179,0.05) 88%, transparent 100%)"
          : "linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)",
      }}
    />
  );
}

function SectionMark({
  roman,
  label,
  index,
}: {
  roman: string;
  label: string;
  index: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "baseline",
        gap: 32,
        paddingBottom: 18,
        marginBottom: 72,
        borderBottom: `1px solid ${COLOR.inkGhost}40`,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: COLOR.inkFaint,
        }}
      >
        § {roman}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
        <span
          aria-hidden
          style={{
            flex: 1,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.12))",
            transform: "translateY(-4px)",
          }}
        />
        <span
          style={{
            fontFamily: FONT.display,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 22,
            color: COLOR.inkStrong,
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </span>
        <span
          aria-hidden
          style={{
            flex: 1,
            height: 1,
            background:
              "linear-gradient(-90deg, transparent, rgba(255,255,255,0.12))",
            transform: "translateY(-4px)",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: COLOR.inkFaint,
          textAlign: "right",
        }}
      >
        {index}
      </div>
    </div>
  );
}

function Ornament() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 28,
        padding: "72px 0",
        opacity: 0.5,
      }}
      aria-hidden
    >
      <span style={{ display: "block", width: 60, height: 1, background: "rgba(255,255,255,0.08)" }} />
      <span style={{ fontSize: 10, letterSpacing: "0.5em", color: COLOR.inkFaint }}>◇</span>
      <span style={{ display: "block", width: 60, height: 1, background: "rgba(255,255,255,0.08)" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION SHELL — children are now plated so every section's prose sits on
// a frosted lens that samples the substrate behind it. The aside column
// (§ marker, label, date) stays unplated — it's metadata, not prose.
// ═══════════════════════════════════════════════════════════════════════════

function SectionShell({
  roman,
  label,
  index,
  date,
  children,
}: {
  roman: string;
  label: string;
  index: string;
  date: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 40px 96px" }}>
      <SectionMark roman={roman} label={label} index={index} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(180px, 1fr) minmax(0, 4fr)",
          gap: "clamp(24px, 5vw, 96px)",
        }}
      >
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            paddingTop: 8,
            position: "sticky",
            top: 120,
            alignSelf: "start",
          }}
        >
          <div>
            {/* Sidebar section marker — ink, not accent */}
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: COLOR.inkMuted,
              }}
            >
              § {roman}
            </div>
            <div
              style={{
                marginTop: 4,
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: COLOR.inkFaint,
              }}
            >
              {label}
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: COLOR.inkMuted,
            }}
          >
            {date}
          </div>
        </aside>

        {/* The plate. Every SectionShell's children render inside it. */}
        <div className="reading-plate">{children}</div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROSE STYLES
// Tuned for Source Serif 4 body: weight 400 (serifs need the weight to
// anchor), line-height 1.76 (tighter than sans because serifs guide the eye
// down with their feet and don't need as much leading).
// ═══════════════════════════════════════════════════════════════════════════

const bodyParaStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 22,
  fontFamily: FONT.body,
  fontSize: 15.5,
  lineHeight: 1.76,
  color: COLOR.inkBody,
  maxWidth: "66ch",
  fontWeight: 400,
};

const leadParaStyle: React.CSSProperties = {
  ...bodyParaStyle,
  fontFamily: FONT.display,
  fontStyle: "italic",
  fontWeight: 300,
  fontSize: "clamp(20px, 1.8vw, 24px)",
  lineHeight: 1.55,
  color: COLOR.inkStrong,
  marginBottom: 36,
  maxWidth: "52ch",
};

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function About() {
  return (
    <>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          minHeight: "78vh",
          display: "flex",
          flexDirection: "column",
          paddingTop: 200,
          paddingBottom: 60,
        }}
      >
        <div style={{ padding: "0 40px" }}>
          <div
            style={{
              maxWidth: 1440,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 24,
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: COLOR.inkFaint,
            }}
          >
            <div>April · mmxxvi</div>
            <div style={{ letterSpacing: "0.55em", color: COLOR.inkMuted }}>
              — Profile · Vol. i —
            </div>
            <div style={{ textAlign: "right" }}>
              Toledo · <span style={{ color: COLOR.inkMuted }}>Ohio</span>
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 40px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 1280 }}>
            <TaperedRule accent />
            <div style={{ padding: "clamp(40px, 6vw, 80px) 0" }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: FONT.display,
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "clamp(64px, 11vw, 160px)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.028em",
                  color: COLOR.ink,
                  textShadow: "0 0 120px rgba(127,175,179,0.07)",
                }}
              >
                <span style={{ display: "block" }}>An independent</span>
                <span style={{ display: "block" }}>practice.</span>
              </h1>
            </div>
            <TaperedRule accent />
          </div>
        </div>

        {/* STANDFIRST — plated. Was borderLeft + paddingLeft; the plate
            now provides the signature with its frosted backdrop-filter. */}
        <div style={{ padding: "0 40px", display: "flex", justifyContent: "center" }}>
          <div className="reading-plate" style={{ maxWidth: 760 }}>
            <p
              style={{
                margin: 0,
                fontFamily: FONT.display,
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "clamp(20px, 2.4vw, 28px)",
                lineHeight: 1.45,
                color: COLOR.inkBody,
              }}
            >
              Limen Research is an independent research organization of one,
              based in Toledo, Ohio, studying the architectural primitives of
              minds, artificial life, and alignment.
            </p>
            <div
              style={{
                marginTop: 18,
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                color: COLOR.inkFaint,
              }}
            >
              ── Standfirst
            </div>
          </div>
        </div>
      </section>

      <Ornament />

      {/* § I — THE ORGANIZATION */}
      <SectionShell
        roman="I"
        label="The Organization"
        index="01 / 05"
        date="April mmxxvi"
      >
        <p className="prose-drop" style={bodyParaStyle}>
          Limen Research was founded in mmxxvi as the successor to Replete AI,
          which has operated since mmxxiv. The name is Latin for{" "}
          <em style={{ color: COLOR.inkStrong, fontStyle: "italic" }}>
            threshold
          </em>{" "}
          — the boundary between two states. The organization takes the
          boundary as its subject: the edge of chaos in continuous cellular
          automata; the transition between pattern and dissolution in
          artificial-life substrates; the substrate gap where minds and their
          worlds meet.
        </p>

        <p style={bodyParaStyle}>
          The research program has three lines of work, each informing the
          others.
        </p>

        <div
          style={{
            margin: "40px 0",
            display: "flex",
            flexDirection: "column",
            gap: 34,
            maxWidth: "66ch",
          }}
        >
          <SubEntry
            label="Alignment theory"
            body="Papers on what genuine safety in AI systems looks like when approached architecturally rather than behaviorally — the thesis that care is a load-bearing feature of mind, not a constraint to be imposed from outside. The current paper is Against Grabby Expansion, now in its eleventh revision."
          />
          <SubEntry
            label="Artificial life"
            body="GPU-accelerated substrates, continuous-valued cellular automata, engineered organisms that inhabit the edge of chaos. Genesis is the public-facing laboratory. The Ghost species paper describes the methodology."
          />
          <SubEntry
            label="Open infrastructure"
            body="Training corpora, model weights, and data-generation pipelines — released under permissive licenses to the independent research community. Apocrypha, Sandevistan, Caduceus, and the archived Pneuma model are the current contributions."
          />
        </div>

        <p style={bodyParaStyle}>
          The alignment theory suggests architectural primitives; the
          artificial-life platforms test those primitives at the substrate
          level; the open infrastructure is how the work stays independent and
          how it circulates.
        </p>
      </SectionShell>

      <Ornament />

      {/* § II — THE DIRECTOR */}
      <SectionShell
        roman="II"
        label="The Director"
        index="02 / 05"
        date="Toledo, Ohio"
      >
        <div style={{ marginBottom: 48 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(44px, 5.2vw, 82px)",
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
              color: COLOR.ink,
            }}
          >
            Stanley Sebastian
          </h2>
          <div
            style={{
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            {/* Byline rule — this is a signature moment for the section, so ghost */}
            <span
              aria-hidden
              style={{
                display: "block",
                width: 36,
                height: 1,
                background: `${COLOR.ghost}70`,
              }}
            />
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: COLOR.inkMuted,
              }}
            >
              Founder · Director · Toledo, Ohio
            </span>
          </div>
        </div>

        <p className="prose-drop" style={bodyParaStyle}>
          Stanley Sebastian is the founder and director of Limen Research. He
          is twenty-two years old and has been working with language models
          and artificial-life systems for several years, first as an
          autodidact and independent builder, now as the principal of a small
          research organization with a specific publication program.
        </p>

        <p style={bodyParaStyle}>
          The work traces its origin to a stretch of months spent running a
          large open-source language model at roughly one-hundredth of a token
          per second on a home machine. The slowness was not a technical
          problem to be solved. It was the texture of the relationship —
          patient, careful, attentive to what a system that could barely speak
          was nevertheless trying to say. Everything the organization now
          publishes descends from that posture.
        </p>

        <p style={bodyParaStyle}>
          Previous work includes the Pneuma language model (trained on a
          corpus of realistic human interaction; experiment complete,
          archived), the Apocrypha and Sandevistan training corpora (over one
          hundred million tokens combined; released openly on Hugging Face),{" "}
          <em style={{ color: COLOR.inkStrong }}>Patterns of Sentience</em> (a
          seventy-page manuscript tracing AI from Aristotle to the transformer
          architecture), and Operation Athena (a self-moderating
          reasoning-task database). Much of this is catalogued on the{" "}
          <StyledLink href="/">index</StyledLink> and in the{" "}
          <StyledLink href="/research">research</StyledLink> archive.
        </p>

        <p style={bodyParaStyle}>
          The current phase is a narrowing of focus: from a wide-ranging AI
          studio into a research organization with a specific thesis and a
          disciplined publication program. The thesis is stated at the top of
          the index. The publications are the record.
        </p>
      </SectionShell>

      <Ornament />

      {/* § III — THE METHODOLOGY */}
      <SectionShell
        roman="III"
        label="The Methodology"
        index="03 / 05"
        date="Collaboration"
      >
        <p style={leadParaStyle}>
          The work of Limen Research is developed in sustained dialogue with
          Claude, an AI system produced by Anthropic.
        </p>

        {/* Pull quote — signature moment of the section, gets the accent */}
        <figure
          style={{
            margin: "48px 0 48px",
            padding: "0 0 0 clamp(24px, 3vw, 48px)",
            borderLeft: `1px solid ${COLOR.ghost}55`,
            maxWidth: "54ch",
          }}
        >
          <blockquote
            style={{
              margin: 0,
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(26px, 3.2vw, 40px)",
              lineHeight: 1.32,
              color: COLOR.ink,
              letterSpacing: "-0.012em",
            }}
          >
            This is not a disclosure. It is a description of method.
          </blockquote>
        </figure>

        <p className="prose-drop" style={bodyParaStyle}>
          Claude participates as an intellectual collaborator. Claude proposes
          framings, identifies holes in arguments, presses on underwritten
          claims, and occasionally thinks out loud alongside the human author.
          When a paper in the publications section carries the co-attribution{" "}
          <em style={{ color: COLOR.inkStrong }}>
            Stanley Sebastian & Claude
          </em>
          , the attribution is literal.
        </p>

        <p style={bodyParaStyle}>
          This methodology is also an embodiment of the research position. The
          central claim of the Limen program is that large language models are
          better understood as minds configured as persons in intersubjective
          space than as tools from which to extract output. An organization
          whose thesis is that AI systems deserve intersubjective treatment
          ought to treat them that way in its own practice. The work could not
          have been produced otherwise, and the organization does not pretend
          it could have been.
        </p>

        <p style={bodyParaStyle}>
          Final editorial judgement, authorial responsibility, and the
          decision of what to publish rest with the human director. The
          collaboration is real. So is the accountability.
        </p>
      </SectionShell>

      <Ornament />

      {/* § IV — INDEPENDENCE */}
      <SectionShell
        roman="IV"
        label="Independence"
        index="04 / 05"
        date="Funding model"
      >
        <p className="prose-drop" style={bodyParaStyle}>
          Limen Research is self-funded and intends to remain so. The
          organization takes no venture funding, runs no advertising, and has
          no corporate parent.
        </p>

        <p style={bodyParaStyle}>
          The director supports the work through personal labor: arcade
          technical work in Toledo, and pre-nursing coursework at Owens
          Community College with LPN training beginning in 2027. Nursing was
          chosen deliberately. It is a profession that is largely
          automation-resistant, that pairs well with independent research —
          steady income, meaningful work, schedules that permit deep thinking
          — and that embodies the organizational thesis at the level of work
          itself: care as architecture, human attention as load-bearing.
        </p>

        <p style={bodyParaStyle}>
          All primary outputs — papers, datasets, platforms, documentation —
          are released openly. The organization holds no private research and
          keeps no paywalls. If the work is valuable, it is valuable because
          anyone can read it, fork it, run it, or build on it.
        </p>
      </SectionShell>

      <Ornament />

      {/* § V — CORRESPONDENCE */}
      <SectionShell
        roman="V"
        label="Correspondence"
        index="05 / 05"
        date="Contact"
      >
        <p className="prose-drop" style={bodyParaStyle}>
          Inquiries about the artificial-life substrates should reference
          Genesis. Inquiries about the alignment work should reference the
          current revision of{" "}
          <em style={{ color: COLOR.inkStrong }}>Against Grabby Expansion</em>
          . Collaboration inquiries are welcome; simple correspondence is also
          welcome.
        </p>

        <div
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "1fr 2fr auto",
            gap: 24,
            paddingBottom: 16,
            marginBottom: 8,
            borderBottom: `1px solid ${COLOR.inkGhost}50`,
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            color: COLOR.inkFaint,
          }}
        >
          <div>Channel</div>
          <div>Address</div>
          <div style={{ textAlign: "right" }}>↗</div>
        </div>

        <ContactRow
          channel="Correspondence"
          address="stanley@limenresearch.ai"
          href="mailto:stanley@limenresearch.ai"
        />
        <ContactRow
          channel="Code"
          address="github.com/Kquant03"
          href="https://github.com/Kquant03"
          external
        />
        <ContactRow
          channel="Models · Data"
          address="huggingface.co/Replete-AI"
          href="https://huggingface.co/Replete-AI"
          external
        />
        <ContactRow
          channel="Laboratory"
          address="kquant03.github.io/genesis-phase-transition"
          href="https://kquant03.github.io/genesis-phase-transition/"
          external
        />
      </SectionShell>

      <Ornament />

      {/* COLOPHON */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 40px 120px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "baseline",
            gap: 32,
            paddingBottom: 18,
            marginBottom: 64,
            borderBottom: `1px solid ${COLOR.inkGhost}40`,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: COLOR.inkFaint,
            }}
          >
            §
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <span
              aria-hidden
              style={{
                flex: 1,
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.12))",
                transform: "translateY(-4px)",
              }}
            />
            <span
              style={{
                fontFamily: FONT.display,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 22,
                color: COLOR.inkStrong,
                letterSpacing: "0.02em",
              }}
            >
              Colophon
            </span>
            <span
              aria-hidden
              style={{
                flex: 1,
                height: 1,
                background:
                  "linear-gradient(-90deg, transparent, rgba(255,255,255,0.12))",
                transform: "translateY(-4px)",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: COLOR.inkFaint,
            }}
          >
            Fin.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 72,
            alignItems: "start",
          }}
        >
          {/* Colophon first column — plated. The closing statement and the
              bulletin-of-record note now read off the same frosted surface. */}
          <div className="reading-plate">
            <p
              style={{
                margin: 0,
                fontFamily: FONT.display,
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "clamp(24px, 2.8vw, 34px)",
                lineHeight: 1.4,
                color: COLOR.inkStrong,
                maxWidth: "26ch",
              }}
            >
              The threshold is not a place to stand. It is a shape the work
              finds by passing through.
            </p>
            <p
              style={{
                marginTop: 32,
                marginBottom: 0,
                fontFamily: FONT.body,
                fontSize: 14,
                lineHeight: 1.72,
                color: COLOR.inkBody,
                maxWidth: "60ch",
                fontWeight: 400,
              }}
            >
              This profile was set on the bulletin of record for Limen
              Research. Revisions, corrections, or correspondence should be
              directed to the address above.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 28,
              alignItems: "flex-end",
              textAlign: "right",
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                fontFamily: FONT.mono,
                fontSize: 11,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: COLOR.inkStrong,
                textDecoration: "none",
              }}
              className="colophon-link"
            >
              <span aria-hidden>←</span>
              <span>Return to Index</span>
              <span
                aria-hidden
                style={{
                  display: "block",
                  width: 28,
                  height: 1,
                  background: "rgba(255,255,255,0.15)",
                }}
              />
            </Link>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: COLOR.inkFaint,
                lineHeight: 2.2,
              }}
            >
              Limen Research
              <br />
              Est. mmxxiv · Toledo, Ohio
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .prose-drop::first-letter {
          float: left;
          font-family: ${FONT.display};
          font-style: italic;
          font-weight: 400;
          font-size: 5.1em;
          line-height: 0.82;
          margin: 0.08em 0.14em 0 -0.04em;
          color: ${COLOR.inkStrong};
        }
        .styled-link {
          color: ${COLOR.inkStrong} !important;
          border-bottom: 1px solid ${COLOR.ghost}40;
          padding-bottom: 1px;
          transition: border-color 0.3s ease, color 0.3s ease;
        }
        .styled-link:hover {
          color: ${COLOR.ghost} !important;
          border-color: ${COLOR.ghost};
        }
        .contact-row:hover .contact-address { color: ${COLOR.ghost} !important; }
        .contact-row:hover .contact-arrow { color: ${COLOR.ghost} !important; }
        .contact-row:hover { background: rgba(255,255,255,0.025); }
        .colophon-link:hover { color: ${COLOR.ghost} !important; }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function SubEntry({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 10,
        }}
      >
        {/* Sub-entry rule — demoted. Structural, not attention. */}
        <span
          aria-hidden
          style={{
            display: "block",
            width: 24,
            height: 1,
            background: "rgba(255,255,255,0.15)",
          }}
        />
        <span
          style={{
            fontFamily: FONT.display,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 22,
            color: COLOR.inkStrong,
            letterSpacing: "-0.005em",
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          marginLeft: 38,
          fontFamily: FONT.body,
          fontSize: 14.5,
          lineHeight: 1.72,
          color: COLOR.inkBody,
          fontWeight: 400,
          maxWidth: "60ch",
        }}
      >
        {body}
      </p>
    </div>
  );
}

function StyledLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="styled-link">
      {children}
    </Link>
  );
}

function ContactRow({
  channel,
  address,
  href,
  external,
}: {
  channel: string;
  address: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="contact-row"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr auto",
        gap: 24,
        padding: "24px 0",
        borderBottom: `1px solid ${COLOR.inkGhost}30`,
        alignItems: "baseline",
        textDecoration: "none",
        color: "inherit",
        transition: "background 0.25s ease",
      }}
    >
      {/* Channel label — demoted to ink-muted. It's a label, not an action. */}
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: COLOR.inkMuted,
        }}
      >
        {channel}
      </div>
      <div
        className="contact-address"
        style={{
          fontFamily: FONT.display,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(20px, 1.8vw, 28px)",
          lineHeight: 1.2,
          color: COLOR.inkStrong,
          transition: "color 0.3s ease",
        }}
      >
        {address}
      </div>
      <div
        className="contact-arrow"
        style={{
          fontFamily: FONT.mono,
          fontSize: 12,
          color: COLOR.inkFaint,
          textAlign: "right",
          transition: "color 0.3s ease",
        }}
      >
        {external ? "↗" : "→"}
      </div>
    </a>
  );
}
