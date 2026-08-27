import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// GET /api/declaration - how many people have signed so far
export async function GET() {
  try {
    const res = await query(
      `SELECT COALESCE(MAX(signature_number), 1199) AS latest FROM declaration_signatures`
    );
    return NextResponse.json({ count: Number(res.rows[0]?.latest ?? 1199) });
  } catch (error) {
    console.error("Declaration count error:", error);
    return NextResponse.json({ count: 1199 });
  }
}

// POST /api/declaration - sign it. Name and date of birth, nothing else.
export async function POST(req: NextRequest) {
  try {
    const { name, birthDate } = await req.json();

    const trimmed = typeof name === "string" ? name.trim() : "";
    if (trimmed.length < 2 || trimmed.length > 80) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return NextResponse.json({ error: "Please enter your date of birth." }, { status: 400 });
    }

    const born = new Date(birthDate + "T00:00:00");
    const now = new Date();
    if (Number.isNaN(born.getTime()) || born > now || born.getFullYear() < 1900) {
      return NextResponse.json({ error: "That date of birth doesn't look right." }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO declaration_signatures (name, birth_date)
       VALUES ($1, $2)
       RETURNING signature_number, created_at`,
      [trimmed, birthDate]
    );

    const row = res.rows[0];

    void notify({
      headline: "Someone signed the Philadelphia Declaration",
      subject: "a new Declaration signature",
      fields: [
        ["Name", trimmed],
        ["Signature number", `No. ${row.signature_number}`],
        ["Date of birth", birthDate],
      ],
    }).catch(() => {});

    return NextResponse.json({
      name: trimmed,
      number: Number(row.signature_number),
      date: new Date(row.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    });
  } catch (error) {
    console.error("Declaration sign error:", error);
    return NextResponse.json({ error: "We couldn't record that. Try again." }, { status: 500 });
  }
}
