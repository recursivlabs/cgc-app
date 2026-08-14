import type { Metadata } from "next";
import EventsBrowser from "./EventsBrowser";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Common Ground Campus events across the country — dialogues, service projects, pop-up cinemas, and the US250 Tailgate Tour.",
};

export default function EventsPage() {
  return <EventsBrowser />;
}
