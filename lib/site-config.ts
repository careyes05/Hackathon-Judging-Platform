/**
 * EVERYTHING THE CLUB EDITS LIVES HERE.
 *
 * Wording, logos and the brand name are all in this one file so nobody has
 * to open a component to change them. Colors live in `app/globals.css`, in
 * the token block at the very top.
 *
 * To change wording: edit the strings below and redeploy.
 * To add a logo: drop the image in `public/logos/`, then fill in the matching
 * slot (see `logos` below). Set a slot back to `null` to hide it again.
 */

export type LogoSlot = {
  /** Path under `public/`, e.g. "/logos/fordham.png" */
  src: string;
  /** Describes the logo for screen readers. Required. */
  alt: string;
  /** Rendered height in pixels. Width scales automatically. */
  height: number;
  /** Optional: makes the logo a link. */
  href?: string;
} | null;

export const siteConfig = {
  /** Browser tab title and search description. */
  meta: {
    title: "Fordham Hackathon",
    description:
      "Event pages, team submissions and judging for the Fordham hackathon, presented by GPMC and the Fordham Artificial Intelligence Society.",
  },

  brand: {
    /** Wordmark in the top-left. Rendered as leadTrail, trail in lighter weight. */
    wordmarkLead: "fordham",
    wordmarkTrail: "hackathon",
    /** Screen-reader label for the home link. */
    homeLabel: "Fordham Hackathon home",
  },

  /**
   * LOGO SLOTS — every place a logo can appear.
   *
   * Example once you have the files in `public/logos/`:
   *
   *   header: { src: "/logos/club.png", alt: "Fordham AI Club", height: 30 },
   *   partners: [
   *     { src: "/logos/fordham.png", alt: "Fordham University", height: 34 },
   *   ],
   *
   * `header` replaces the icon mark beside the wordmark when set.
   * `partners` renders a row above the footer on every page.
   */
  logos: {
    /**
     * Set this to put a club mark beside the wordmark in the top-left, e.g.
     *   { src: "/logos/fordham-ais-mark.png", alt: "Fordham AI Society", height: 30 }
     * Left null so neither co-hosting club sits above the other by default.
     */
    header: null as LogoSlot,
    hero: null as LogoSlot,
    eventPage: null as LogoSlot,
    staff: null as LogoSlot,
    footer: null as LogoSlot,
    /** Both club logos, side by side above the footer on every page. */
    partners: [
      { src: "/logos/gpmc.png", alt: "Gabelli Product Management Club", height: 40 },
      { src: "/logos/fordham-ais.png", alt: "Fordham Artificial Intelligence Society", height: 40 },
    ] as NonNullable<LogoSlot>[],
  },

  nav: {
    exploreEvents: "Explore events",
    staff: "Judges & organizers",
  },

  footer: {
    tagline: "Built by Fordham students.",
    credit: "Fordham Hackathon",
    year: "2026",
    /** Heading above the partner logo row. Empty string hides it. */
    partnersLabel: "PRESENTED BY",
  },

  landing: {
    eyebrow: "THE PLACE WHERE IDEAS SHIP",
    headlineTop: "Make a little",
    headlineBottom: "future.",
    intro:
      "Find your next hackathon, share what your team is building, and give great ideas the recognition they deserve.",
    cta: "Find your event",
    artCardBackLabel: "IDEA → IMPACT",
    artCardFront: ["Build", "the next", "thing."],
    artCardNote: "NO PERMISSION NEEDED",
    artTag: ["GOOD THINGS", "START HERE"],
    eventsEyebrow: "YOUR NEXT BIG IDEA",
    eventsHeading: "Open hackathons",
    hostLink: "Host an event",
    setupTitle: "One last connection before launch",
    setupBody:
      "Connect your free Supabase project to publish events and accept submissions. Setup steps are in the README.",
    emptyTitle: "The next big thing starts with an event.",
    emptyBody: "No hackathons yet. Sign in as an organizer to create the first one.",
    emptyCta: "Open organizer portal",
    bannerEyebrow: "01 — FROM FIRST SKETCH TO FINAL PITCH",
    bannerTop: "Build boldly.",
    bannerBottom: "Judge fairly.",
    dateTbd: "Date to be announced",
  },

  eventPage: {
    backLink: "All events",
    eyebrow: "THE INVITATION",
    submitCta: "Submit your project",
    stampTop: "MAKE",
    stampMiddle: ["IT", "REAL"],
    stampBottom: "TOGETHER",
    briefEyebrow: "01 / THE BRIEF",
    briefHeading: ["Bring your", "curiosity."],
    themesEyebrow: "02 / AREAS TO EXPLORE",
    themesHeading: ["Choose a", "direction."],
    themesEmpty: "All ideas welcome",
    ctaEyebrow: "READY WHEN YOU ARE",
    ctaHeading: ["Your team's next", "chapter starts here."],
    ctaButton: "Upload your submission",
    dateTbd: "Date to be announced",
  },

  submitPage: {
    backPrefix: "Back to",
    eyebrow: "TEAM SUBMISSION",
    headingTop: "Show us",
    headingBottom: "what you made.",
    intro:
      "Tell us about your project. Your team can come back and update this submission anytime with its edit code.",
  },

  staff: {
    introEyebrow: "THE PEOPLE BEHIND THE BUILD",
    introHeadingTop: "Thoughtful",
    introHeadingBottom: "by design.",
    introBody: "Host an event, see what teams are making, and make every score count.",
    introNote: "For organizers & judges",
    signInEyebrow: "STAFF ACCESS",
    signInBadge: "PRIVATE",
    signInHeadingTop: "Good ideas need",
    signInHeadingBottom: "good judges.",
    signInBody: "Sign in with the email and password for your invited staff account.",
    signInFootnote:
      "Need an account or password? Ask your organizer to create or reset your staff account.",
    workspaceEyebrow: "STAFF WORKSPACE",
    adminHeading: "Make it happen.",
    judgeHeading: "Make it count.",
    deskEyebrow: "THE JUDGE'S DESK",
    deskHeading: "Score the work.",
    privacyNote:
      "Scores are private to each judge. Every project below has its own independent scorecard.",
    resultsEyebrow: "ORGANIZER ONLY",
    resultsHeading: "Results.",
  },
} as const;

export type SiteConfig = typeof siteConfig;
