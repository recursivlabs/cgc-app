export type EventKind = "dialogue" | "service" | "cinema" | "us250" | "online";

export interface CgcEvent {
  slug: string;
  title: string;
  campus: string;
  state: string; // two-letter
  kind: EventKind;
  topic: string;
  blurb: string;
  vimeoIds?: string[];
  upcoming?: boolean;
  date?: string; // ISO when known
}

export const KIND_LABELS: Record<EventKind, string> = {
  dialogue: "Bridging the Divide",
  service: "Bridge to Tomorrow",
  cinema: "Pop-Up Cinema",
  us250: "US250 Tour",
  online: "Common Bridge",
};

/** Past + upcoming events. Source: commongroundcampus.com + kickoff call 2026-08-14. */
export const EVENTS: CgcEvent[] = [
  {
    slug: "common-bridge-august",
    title: "Common Bridge: First Online Summit",
    campus: "Online",
    state: "US",
    kind: "online",
    topic: "Youth leadership",
    blurb:
      "The first monthly forum for past and present CGC leaders across the country. Invitation only — members can invite others.",
    upcoming: true,
    date: "2026-08-20",
  },
  {
    slug: "north-georgia",
    title: "University of North Georgia",
    campus: "University of North Georgia",
    state: "GA",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "The US250 tour comes to North Georgia. Dates announced soon.",
    upcoming: true,
  },
  {
    slug: "ug",
    title: "University of Georgia",
    campus: "University of Georgia",
    state: "GA",
    kind: "dialogue",
    topic: "Race on campus",
    blurb:
      "Students with opposing views took the stage to talk about race — and found the concerns they shared.",
    vimeoIds: ["716797965", "717618948", "717620232", "717621985", "717624247", "717624812"],
  },
  {
    slug: "uh",
    title: "University of Houston",
    campus: "University of Houston",
    state: "TX",
    kind: "dialogue",
    topic: "Student loans",
    blurb:
      "A dialogue on student debt that participants said was “much more fun” than the debate they expected.",
    vimeoIds: ["779667184", "779667477", "779667984", "779668424", "779689730"],
  },
  {
    slug: "wvu",
    title: "West Virginia University",
    campus: "West Virginia University",
    state: "WV",
    kind: "dialogue",
    topic: "Concealed carry",
    blurb:
      "Students asked CGC to help them talk about concealed carry on campus — without the shouting.",
    vimeoIds: ["805295702", "805313299", "805313488", "805313924", "805316672"],
  },
  {
    slug: "mhs",
    title: "Medinah High School",
    campus: "Medinah High School",
    state: "OH",
    kind: "dialogue",
    topic: "Student rights",
    blurb:
      "Our first high school event. Four students tackled student rights in front of peers, teachers, and administrators.",
    vimeoIds: ["783250951", "783251570", "783252308", "783252777", "783252971", "783253274"],
  },
  {
    slug: "hope-college",
    title: "Hope College",
    campus: "Hope College",
    state: "MI",
    kind: "dialogue",
    topic: "DEI",
    blurb:
      "The event some tried to cancel. The students showed up, and parents thanked us afterward.",
  },
  {
    slug: "txb",
    title: "Texas Border Cleanup",
    campus: "Brownsville, TX",
    state: "TX",
    kind: "service",
    topic: "Service",
    blurb:
      "250+ students in 100-degree heat collected more than 7½ tons along the border. “It’s changing how I see things.”",
  },
  {
    slug: "upenn-cinema",
    title: "UPenn Pop-Up Cinema",
    campus: "University of Pennsylvania",
    state: "PA",
    kind: "cinema",
    topic: "Propaganda",
    blurb:
      "A private screening and a critical-thinking conversation about propaganda.",
  },
  {
    slug: "rollins",
    title: "Rollins College",
    campus: "Rollins College",
    state: "FL",
    kind: "dialogue",
    topic: "Bridging the AI Divide",
    blurb:
      "Students on both sides of the AI question found the concerns they shared.",
  },
  {
    slug: "cole-valley-cinema",
    title: "Cole Valley Pop-Up Cinema",
    campus: "Cole Valley Christian Schools",
    state: "ID",
    kind: "cinema",
    topic: "Critical thinking",
    blurb: "A free screening event built around better conversations.",
  },
  {
    slug: "chicago-cleanup",
    title: "Loyola Beach Cleanup",
    campus: "Northwestern U & Loyola U Chicago",
    state: "IL",
    kind: "service",
    topic: "Service",
    blurb:
      "Students from two rival campuses cleaned Loyola Beach together. Curious locals joined in.",
  },
  {
    slug: "rye-beach",
    title: "Rye Beach Cleanup",
    campus: "Rye, New Hampshire",
    state: "NH",
    kind: "service",
    topic: "Service",
    blurb:
      "A beach cleanup that inspired strangers to beautify a neglected park together.",
  },
  {
    slug: "mt-rushmore",
    title: "Mt. Rushmore: Raising Old Glory",
    campus: "Mount Rushmore, SD",
    state: "SD",
    kind: "us250",
    topic: "US250 Tour",
    blurb: "Raising the flag at Mount Rushmore with the US250 tour.",
  },
  {
    slug: "alamo",
    title: "The Alamo",
    campus: "San Antonio, TX",
    state: "TX",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "The US250 Tailgate Tour at the Alamo.",
  },
  {
    slug: "utah-state",
    title: "Utah State University",
    campus: "Utah State University",
    state: "UT",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "US250 Tailgate Tour stop at Utah State.",
  },
  {
    slug: "cal-state",
    title: "Cal State",
    campus: "Cal State",
    state: "CA",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "US250 Tailgate Tour stop at Cal State.",
  },
  {
    slug: "cattle-creek",
    title: "Cattle Creek Farm",
    campus: "Cattle Creek Farm, OH",
    state: "OH",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "US250 Tailgate Tour at Cattle Creek Farm.",
  },
];

export const HERO_VIMEO_ID = "755151294";

export function eventStates(): string[] {
  return [...new Set(EVENTS.map((e) => e.state).filter((s) => s !== "US"))].sort();
}
