import { notFound } from "next/navigation";
import EventDetail from "@/components/event-detail";
import { getHackathonBySlug } from "@/lib/hackathons";

type Props = { params: Promise<{ slug: string }> };

export default async function HackathonPage({ params }: Props) {
  const { slug } = await params;
  const event = await getHackathonBySlug(slug);
  if (!event) notFound();

  return <EventDetail event={event} />;
}
