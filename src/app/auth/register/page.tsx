import { redirect } from "next/navigation";

export default async function RegisterPage(props: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await props.searchParams;
  const returnTo = params.returnTo;
  redirect(returnTo ? `/auth?returnTo=${encodeURIComponent(returnTo)}` : "/auth");
}
