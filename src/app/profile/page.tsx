import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function MyProfileRedirectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await ensureProfile(user.id, user.email);
  redirect(`/u/${encodeURIComponent(profile.username)}`);
}