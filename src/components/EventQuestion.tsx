"use client";

import { useState } from "react";
import InquiryForm from "@/components/InquiryForm";
import { INQUIRIES } from "@/lib/inquiries";

/** A question about one event, asked without leaving the page. */
export default function EventQuestion({ title }: { title: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <p className="mt-4 px-1 text-[13px] leading-relaxed text-[var(--ink-faint)]">
        Questions about this event?{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-semibold text-[var(--ink-dim)] underline underline-offset-2 transition-colors hover:text-[var(--ink)]"
        >
          Ask us
        </button>
      </p>
    );
  }

  return (
    <div className="mt-4">
      <InquiryForm spec={INQUIRIES.event} context={title} compact />
    </div>
  );
}
