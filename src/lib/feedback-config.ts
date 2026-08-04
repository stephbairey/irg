// Feedback widget variants (pre-cutover plan, workstream E3 / D060).
//
// One component (`src/components/FeedbackWidget.astro`), one config. Each
// variant is declared once here with an on/off flag; pages opt in by name.
// Turning the launch-only variant off after the first few months is one
// line in this file — nothing else moves.
//
// All variants post to the existing /wp-json/irg/v1/contact endpoint. The
// endpoint writes its own subject line, so `reason` is folded into the top
// of the message body instead.

export interface FeedbackVariant {
  /** Master switch: false renders nothing wherever the variant is mounted. */
  enabled: boolean;
  /** Small uppercase label above the heading. */
  kicker: string;
  heading: string;
  blurb: string;
  /** Button text on the collapsed call-to-action. */
  cta: string;
  /** Textarea placeholder. */
  placeholder: string;
  /** Prefixed to the message body so the inbox can tell variants apart. */
  reason: string;
}

export const FEEDBACK_VARIANTS = {
  // Temporary: first few months post-launch, on every page type via
  // BaseLayout. Flip `enabled` to false to retire it site-wide.
  launch: {
    enabled: true,
    kicker: "Fresh paint",
    heading: "How is the new site treating you?",
    blurb:
      "This site is newly rebuilt, and we want to hear about it. Something broken, something confusing, something you love? Tell the Web Granny.",
    cta: "Share a thought",
    placeholder: "What's working, what isn't, what surprised you…",
    reason: "Launch feedback",
  },
  // Permanent: Find a Gaggle.
  "gaggle-not-listed": {
    enabled: true,
    kicker: "Missing from the map?",
    heading: "Is your gaggle not listed?",
    blurb:
      "If your gaggle is missing, misplaced, or misspelled, tell us and we'll fix the map.",
    cta: "Tell us about your gaggle",
    placeholder: "Gaggle name, city or region, and how we can reach you…",
    reason: "Gaggle not listed",
  },
  // Permanent: Photos page, above the fold on desktop.
  "send-photos": {
    enabled: true,
    kicker: "Got photos?",
    heading: "Send us your action shots",
    blurb:
      "Photos of grannies in action are the lifeblood of this page. Tell us what you've got and we'll reply with where to send the files.",
    cta: "Tell us about your photos",
    placeholder: "What the photos show, which gaggle, who took them…",
    reason: "Photo submission",
  },
} as const;

export type FeedbackVariantName = keyof typeof FEEDBACK_VARIANTS;
