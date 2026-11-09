import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { Hackathon } from "@/lib/types";

export async function getHackathons(): Promise<{
  configured: boolean;
  hackathons: Hackathon[];
}> {
  if (!isSupabaseConfigured()) return { configured: false, hackathons: [] };

  const { data, error } = await getAdminClient()
    .from("hackathons")
    .select("id, name, slug, description, event_date, location, themes, rubric, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load hackathons: ${error.message}`);
  return { configured: true, hackathons: (data ?? []) as Hackathon[] };
}

export async function getHackathonBySlug(slug: string): Promise<Hackathon | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getAdminClient()
    .from("hackathons")
    .select("id, name, slug, description, event_date, location, themes, rubric, created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load hackathon: ${error.message}`);
  return (data as Hackathon | null) ?? null;
}
