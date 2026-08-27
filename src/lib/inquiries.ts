/** Every enquiry form on the site, described in one place. */
export interface InquiryKind {
  kind: string;
  /** Label for the field that varies by form. Omitted when there isn't one. */
  detailLabel?: string;
  detailOptions?: string[];
  orgLabel?: string;
  locationLabel?: string;
  messageLabel: string;
  messagePlaceholder: string;
  submit: string;
  /** What we tell them once it's sent. */
  done: string;
}

export const INQUIRIES: Record<string, InquiryKind> = {
  host: {
    kind: "host",
    detailLabel: "What kind of event?",
    detailOptions: [
      "Bridging the Divide dialogue",
      "Bridge to Tomorrow service project",
      "Pop-up cinema",
      "US250 Tailgate Tour stop",
      "Not sure yet",
    ],
    orgLabel: "School or organization",
    locationLabel: "City and state",
    messageLabel: "Anything else",
    messagePlaceholder: "A topic you want covered, a date you have in mind, anything.",
    submit: "Send it",
    done: "Felisa reads every one of these herself. She will come back to you.",
  },
  nominate: {
    kind: "nominate",
    orgLabel: "School you're nominating",
    locationLabel: "City and state",
    messageLabel: "Why this campus",
    messagePlaceholder: "What is going on there that we should know about?",
    submit: "Send the nomination",
    done: "Thank you. Universities reach out through this every year, and we read all of them.",
  },
  partner: {
    kind: "partner",
    detailLabel: "How would you like to help?",
    detailOptions: [
      "Mentor a student",
      "Sponsor an event",
      "Partner organization",
      "Speak at an event",
      "Something else",
    ],
    orgLabel: "Organization",
    locationLabel: "City and state",
    messageLabel: "Tell us a little about you",
    messagePlaceholder: "What you do, and what you'd want to bring to a young leader.",
    submit: "Reach out",
    done: "Thank you. Bridge Works runs on people who reach back. We will be in touch.",
  },
  event: {
    kind: "event",
    messageLabel: "Your question",
    messagePlaceholder: "Ask us anything about this event.",
    submit: "Send the question",
    done: "Thank you. We will come back to you before the day.",
  },
};

export function getInquiry(kind: string): InquiryKind | undefined {
  return INQUIRIES[kind];
}
