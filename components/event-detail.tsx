import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, MoveUpRight } from "lucide-react";
import Logo from "@/components/logo";
import { siteConfig } from "@/lib/site-config";
import type { Hackathon } from "@/lib/types";

const copy = siteConfig.eventPage;

function formatDate(value: string | null): string {
  if (!value) return copy.dateTbd;
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

/**
 * The public event page. Kept separate from the route so it can be rendered
 * and reviewed with sample data without a database connection.
 */
export default function EventDetail({ event }: { event: Hackathon }) {
  return (
    <article className="event-page">
      <Link className="back-link" href="/"><ArrowLeft size={15} /> {copy.backLink}</Link>

      {copy.bannerImage ? (
        // The artwork already carries the title, tagline, room, date and both
        // club logos, so none of that is printed again over the top of it.
        <div className="event-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={copy.bannerImage.src} alt={copy.bannerImage.alt} />
        </div>
      ) : (
        <div className="event-hero">
          <div className="event-hero-copy">
            {siteConfig.logos.eventPage ? <Logo slot={siteConfig.logos.eventPage} className="event-logo" /> : null}
            <span className="eyebrow"><span className="pulse-dot" /> {copy.eyebrow}</span>
            <h1>{event.name}<span className="heading-period">.</span></h1>
            {event.description && <p>{event.description}</p>}
            <div className="event-hero-meta">
              <span><CalendarDays size={16} />{formatDate(event.event_date)}</span>
              {event.location && <span><MapPin size={16} />{event.location}</span>}
            </div>
            <Link className="button button-dark" href={`/h/${event.slug}/submit`}>
              {copy.submitCta} <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="event-stamp">
            <span>{copy.stampTop}</span>
            <strong>{copy.stampMiddle[0]}<br />{copy.stampMiddle[1]}</strong>
            <i>✳</i>
            <span>{copy.stampBottom}</span>
          </div>
          <span className="event-hero-count">HACKATHON / {event.slug.toUpperCase()}</span>
        </div>
      )}

      <div className="event-detail-grid">
        <section className="detail-block">
          <span className="eyebrow muted-eyebrow">{copy.briefEyebrow}</span>
          <h2>{copy.briefHeading[0]}<br /><em>{copy.briefHeading[1]}</em></h2>
          {event.description && <p>{event.description}</p>}
        </section>
        <section className="detail-block themes-block">
          <span className="eyebrow muted-eyebrow">{copy.themesEyebrow}</span>
          {/* The event's own themes headline this space — there is no fixed heading. */}
          <div className="theme-headline">
            {event.themes.length
              ? event.themes.map((theme) => <span key={theme}>{theme}</span>)
              : <span className="theme-headline-empty">{copy.themesEmpty}</span>}
          </div>
        </section>
      </div>

      <div className="event-cta">
        <div>
          <span className="eyebrow">{copy.ctaEyebrow}</span>
          <h2>{copy.ctaHeading[0]}</h2>
        </div>
        <Link className="button button-light" href={`/h/${event.slug}/submit`}>
          {copy.ctaButton} <MoveUpRight size={17} />
        </Link>
      </div>
    </article>
  );
}
