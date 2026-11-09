import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, MoveUpRight } from "lucide-react";
import { getHackathonBySlug } from "@/lib/hackathons";

type Props = { params: Promise<{ slug: string }> };

function formatDate(value: string | null): string {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function HackathonPage({ params }: Props) {
  const { slug } = await params;
  const event = await getHackathonBySlug(slug);
  if (!event) notFound();

  return (
    <article className="event-page">
      <Link className="back-link" href="/"><ArrowLeft size={15} /> All events</Link>
      <div className="event-hero">
        <div className="event-hero-copy">
          <span className="eyebrow"><span className="pulse-dot" /> THE INVITATION</span>
          <h1>{event.name}<span className="heading-period">.</span></h1>
          <p>{event.description}</p>
          <div className="event-hero-meta"><span><CalendarDays size={16} />{formatDate(event.event_date)}</span>{event.location && <span><MapPin size={16} />{event.location}</span>}</div>
          <Link className="button button-dark" href={`/h/${event.slug}/submit`}>Submit your project <ArrowUpRight size={16} /></Link>
        </div>
        <div className="event-stamp"><span>MAKE</span><strong>IT<br />REAL</strong><i>✳</i><span>TOGETHER</span></div>
        <span className="event-hero-count">HACKATHON / {event.slug.toUpperCase()}</span>
      </div>
      <div className="event-detail-grid">
        <section className="detail-block"><span className="eyebrow muted-eyebrow">01 / THE BRIEF</span><h2>Bring your<br /><em>curiosity.</em></h2><p>{event.description}</p></section>
        <section className="detail-block themes-block"><span className="eyebrow muted-eyebrow">02 / AREAS TO EXPLORE</span><h2>Choose a<br /><em>direction.</em></h2><div className="theme-list theme-list-large">{event.themes.length ? event.themes.map((theme) => <span key={theme}>{theme}</span>) : <span>All ideas welcome</span>}</div></section>
      </div>
      <div className="event-cta"><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Your team’s next<br />chapter starts here.</h2></div><Link className="button button-light" href={`/h/${event.slug}/submit`}>Upload your submission <MoveUpRight size={17} /></Link></div>
    </article>
  );
}
