import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getHackathonBySlug } from "@/lib/hackathons";
import SubmissionForm from "@/components/submission-form";

type Props = { params: Promise<{ slug: string }> };

export default async function SubmitPage({ params }: Props) {
  const { slug } = await params;
  const event = await getHackathonBySlug(slug);
  if (!event) notFound();

  return (
    <section className="form-page">
      <Link className="back-link" href={`/h/${event.slug}`}><ArrowLeft size={15} /> Back to {event.name}</Link>
      <div className="form-page-heading"><span className="eyebrow"><span className="pulse-dot" /> TEAM SUBMISSION</span><h1>Show us<br /><em>what you made.</em></h1><p>Tell us about your project. Your team can come back and update this submission anytime with its edit code.</p></div>
      <SubmissionForm slug={event.slug} eventName={event.name} />
    </section>
  );
}
