import type { Metadata } from "next";
import VideoUpload from "@/components/VideoUpload";

export const metadata: Metadata = {
  title: "Send your videos",
  description: "Ambassadors: send your videos and photos to Common Ground Campus.",
  robots: { index: false, follow: false },
};

export default function UploadPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 pb-28 pt-36">
      <p className="eyebrow mb-5">Ambassadors</p>
      <h1 className="display text-[clamp(2.4rem,7vw,4.5rem)]">
        Send your <span className="text-[var(--signal)]">videos</span>
      </h1>
      <p className="mb-10 mt-5 text-lg leading-relaxed text-[var(--ink-dim)]">
        Videos and photos, straight from your phone or computer. They go to our social team. Unedited is fine.
      </p>
      <VideoUpload />
    </section>
  );
}
