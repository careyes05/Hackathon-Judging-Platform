import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getHackathonBySlug } from "@/lib/hackathons";
import { siteConfig } from "@/lib/site-config";
import SubmissionForm from "@/components/submission-form";

type Props = { params: Promise<{ slug: string }> };

const copy = siteConfig.submitPage;

export default async function SubmitPage({ params }: Props) {
  const { slug } = await params;
  const event = await getHackathonBySlug(slug);
  if (!event) notFound();

  return (
    <section className="form-page">
      <Link className="back-link" href={`/h/${event.slug}`}><ArrowLeft size={15} /> {copy.backPrefix} {event.name}</Link>
      <div className="form-page-heading"><span className="eyebrow"><span className="pulse-dot" /> {copy.eyebrow}</span><h1>{copy.headingTop}<br /><em>{copy.headingBottom}</em></h1><p>{copy.intro}</p></div>
      <SubmissionForm slug={event.slug} eventName={event.name} />
    </section>
  );
}
