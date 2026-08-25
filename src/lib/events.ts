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
  date?: string; // ISO start date when known
  dateLabel?: string; // human display, e.g. "Sept 4\u20135"
  image?: string; // /events/<slug>.jpg in /public
  flyer?: string; // the event's own promotional flyer
  venue?: string; // room / address from the flyer
  time?: string; // e.g. "8:00 pm ET"
  rsvp?: boolean; // upcoming events that take RSVPs
  inviteOnly?: boolean; // Common Bridge + Bridge Works are invitational
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
      "The first monthly forum for past and present CGC leaders across the country. Invitation only. Members can invite others.",
    upcoming: true,
    date: "2026-08-20",
    time: "8:00 pm ET",
    rsvp: true,
    inviteOnly: true,
  },
  {
    slug: "north-georgia",
    rsvp: true,
    title: "University of North Georgia",
    campus: "University of North Georgia",
    state: "GA",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "The US250 Tailgate Tour comes to North Georgia.",
    upcoming: true,
    date: "2026-09-26",
    dateLabel: "Sept 26",
  },
  {
    slug: "indiana-wesleyan",
    rsvp: true,
    title: "Indiana Wesleyan University",
    campus: "Indiana Wesleyan University",
    state: "IN",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "The US250 Tailgate Tour stops in Marion, Indiana.",
    upcoming: true,
    date: "2026-09-04",
    dateLabel: "Sept 4\u20135",
  },
  {
    slug: "south-fork-ranch",
    rsvp: true,
    title: "South Fork Ranch",
    campus: "South Fork Ranch Event Center, Dallas TX",
    state: "TX",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "A US250 Tailgate Tour event at the South Fork Ranch Event Center.",
    upcoming: true,
    date: "2026-09-17",
    dateLabel: "Sept 17\u201318",
  },
  {
    slug: "south-university-wpb",
    rsvp: true,
    title: "South University, West Palm Beach",
    campus: "South University, West Palm Beach FL",
    state: "FL",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "The US250 Tailgate Tour arrives in West Palm Beach.",
    upcoming: true,
    date: "2026-10-10",
    dateLabel: "Oct 10",
  },
  {
    slug: "ug",
    flyer: "/events/flyers/ug.jpg",
    venue: "Miller LC Building, Athens GA",
    image: "/events/ug.jpg",
    title: "University of Georgia",
    campus: "University of Georgia",
    state: "GA",
    kind: "dialogue",
    topic: "Race on campus",
    blurb:
      "Students with opposing views took the stage to talk about race, and found the concerns they shared.",
    date: "2022-04-14",
    vimeoIds: ["716797965", "717618948", "717620232", "717621985", "717624247", "717624812"],
  },
  {
    slug: "uh",
    flyer: "/events/flyers/uh.jpg",
    image: "/events/uh.jpg",
    title: "University of Houston",
    campus: "University of Houston",
    state: "TX",
    kind: "dialogue",
    topic: "Student loans",
    blurb:
      "A dialogue on student debt that participants said was “much more fun” than the debate they expected.",
    date: "2022-11-15",
    venue: "Farish Hall, Room 232, 3657 Cullen Blvd",
    vimeoIds: ["779667184", "779667477", "779667984", "779668424", "779689730"],
  },
  {
    slug: "wvu",
    flyer: "/events/flyers/wvu.jpg",
    venue: "Gluck Theater, 1550 University Ave, Morgantown WV",
    image: "/events/wvu.jpg",
    title: "West Virginia University",
    campus: "West Virginia University",
    state: "WV",
    kind: "dialogue",
    topic: "Concealed carry",
    blurb:
      "Students asked CGC to help them talk about concealed carry on campus, without the shouting.",
    date: "2023-02-24",
    vimeoIds: ["805295702", "805313299", "805313488", "805313924", "805316672"],
  },
  {
    slug: "mhs",
    flyer: "/events/flyers/mhs.jpg",
    venue: "PAC Lounge Stage Area, 851 Weymouth Rd, Medina OH",
    image: "/events/mhs.jpg",
    title: "Medina High School",
    campus: "Medina High School",
    state: "OH",
    kind: "dialogue",
    topic: "Student rights",
    blurb:
      "Our first high school event. Four students tackled student rights in front of peers, teachers, and administrators.",
    date: "2022-11-29",
    vimeoIds: ["783250951", "783251570", "783252308", "783252777", "783252971", "783253274"],
  },
  {
    slug: "hope-college",
    flyer: "/events/flyers/hope-college.jpg",
    venue: "Winants Auditorium, 263 College Ave, Holland MI",
    image: "/events/hope-college.jpg",
    date: "2023-11-14",
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
    flyer: "/events/flyers/txb.jpg",
    venue: "Cameron County Precinct 1, TX",
    image: "/events/txb.jpg",
    title: "Texas Border Cleanup",
    campus: "Brownsville, TX",
    state: "TX",
    kind: "service",
    topic: "Service",
    blurb:
      "250+ students in 100-degree heat collected more than 7½ tons along the border. “It’s changing how I see things.”",
    date: "2023-09-09",
    dateLabel: "Sept 9\u201310, 2023",
  },
  {
    slug: "upenn-cinema",
    flyer: "/events/flyers/upenn-cinema.jpg",
    venue: "Hall of Flags, 3417 Spruce St, Philadelphia PA",
    date: "2024-04-08",
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
    date: "2025-09-23",
    flyer: "/events/flyers/rollins.jpg",
    venue: "Rice Pavilion, Holt Ave, Winter Park FL",
    image: "/events/rollins.jpg",
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
    date: "2024-05-21",
    flyer: "/events/flyers/cole-valley-cinema.jpg",
    venue: "Cole Valley Christian School, 200 E Carlton Ave, Meridian ID",
    title: "Cole Valley Pop-Up Cinema",
    campus: "Cole Valley Christian Schools",
    state: "ID",
    kind: "cinema",
    topic: "Critical thinking",
    blurb: "A free screening event built around better conversations.",
  },
  {
    slug: "chicago-cleanup",
    flyer: "/events/flyers/chicago-cleanup.jpg",
    venue: "Loyola Beach, 1230 W Greenleaf Ave, Chicago",
    date: "2025-04-12",
    image: "/events/chicago-cleanup.jpg",
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
    flyer: "/events/flyers/rye-beach.jpg",
    venue: "Jenness Beach, Rye NH",
    date: "2023-04-15",
    image: "/events/rye-beach.jpg",
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
    date: "2025-07-04",
    dateLabel: "2025",
    image: "/events/mt-rushmore.jpg",
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
    date: "2026-05-01",
  },
  {
    slug: "columbus-state",
    title: "Columbus State University",
    campus: "Columbus State University, GA",
    state: "GA",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "The US250 Tailgate Tour near Columbus State.",
    date: "2026-04-23",
  },
  {
    slug: "utah-state",
    title: "Utah State University",
    campus: "Utah State University",
    state: "UT",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "US250 Tailgate Tour stop at Utah State.",
    date: "2026-07-10",
  },
  {
    slug: "cal-state",
    title: "Cal State",
    campus: "Cal State, amphitheater & Riverwalk",
    state: "CA",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "US250 Tailgate Tour at the amphitheater and Riverwalk near Cal State.",
    date: "2026-07-02",
  },
  {
    slug: "cattle-creek",
    title: "Cattle Creek Farm",
    campus: "Cattle Creek Farm, Bryan OH",
    state: "OH",
    kind: "us250",
    topic: "US250 Tailgate Tour",
    blurb: "US250 Tailgate Tour at Cattle Creek Farm in Bryan, Ohio.",
    date: "2026-07-23",
  },
];

export const HERO_IMAGE = "/events/hero.jpg";

export const HERO_VIMEO_ID = "755151294";

export function eventStates(): string[] {
  return [...new Set(EVENTS.map((e) => e.state).filter((s) => s !== "US"))].sort();
}

/** Schools and places CGC has worked with - pennant marquee. */
export const SCHOOLS = [
  "Georgia",
  "Houston",
  "West Virginia",
  "Hope College",
  "Rollins",
  "Penn",
  "Utah State",
  "North Georgia",
  "Indiana Wesleyan",
  "Northwestern",
  "Loyola Chicago",
  "Cal State",
  "Medinah",
  "South University",
];

export function upcomingEvents(): CgcEvent[] {
  return EVENTS.filter((e) => e.upcoming).sort((a, b) =>
    (a.date || "9999").localeCompare(b.date || "9999")
  );
}

export function archivedEvents(): CgcEvent[] {
  return EVENTS.filter((e) => !e.upcoming).sort((a, b) =>
    (b.date || "0000").localeCompare(a.date || "0000")
  );
}

export function getEvent(slug: string): CgcEvent | undefined {
  return EVENTS.find((e) => e.slug === slug);
}
