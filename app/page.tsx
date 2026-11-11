import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CalendarDays, MapPin, Plus, Sparkles } from "lucide-react";
import Logo from "@/components/logo";
import { getHackathons } from "@/lib/hackathons";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const copy = siteConfig.landing;

function formatDate(value: string | null): string {
  if (!value) return copy.dateTbd;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function HomePage() {
  const { configured, hackathons } = await getHackathons();

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          {siteConfig.logos.hero ? <Logo slot={siteConfig.logos.hero} className="hero-logo" /> : null}
          <span className="eyebrow"><span className="pulse-dot" /> {copy.eyebrow}</span>
          <h1>{copy.headlineTop}<br /><span>{copy.headlineBottom}</span></h1>
          <p>{copy.intro}</p>
          <a className="button button-dark" href="#events">{copy.cta} <ArrowDownRight size={17} /></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-card art-card-back"><span>{copy.artCardBackLabel}</span><div className="mini-bars"><i /><i /><i /><i /></div></div>
          <div className="art-card art-card-front">
            <span className="art-star">✳</span>
            <strong>{copy.artCardFront.map((line, index) => <span key={line}>{line}{index < copy.artCardFront.length - 1 ? <br /> : null}</span>)}</strong>
            <span className="art-note">{copy.artCardNote}</span>
          </div>
          <span className="art-sparkle sparkle-one">✳</span><span className="art-sparkle sparkle-two">✦</span>
          <span className="art-tag">{copy.artTag[0]}<br />{copy.artTag[1]}</span>
        </div>
        <div className="hero-index">01 <span>/</span> 03</div>
      </section>

      <section className="event-section" id="events">
        <div className="section-heading">
          <div><span className="eyebrow muted-eyebrow">{copy.eventsEyebrow}</span><h2>{copy.eventsHeading}<span className="heading-period">.</span></h2></div>
          <Link className="text-link" href="/judges">{copy.hostLink} <ArrowUpRight size={16} /></Link>
        </div>
        {!configured ? (
          <div className="setup-notice">
            <div className="notice-icon"><Sparkles size={19} /></div>
            <div><strong>{copy.setupTitle}</strong><p>{copy.setupBody}</p></div>
          </div>
        ) : hackathons.length === 0 ? (
          <div className="empty-state"><span className="empty-icon"><Plus size={19} /></span><strong>{copy.emptyTitle}</strong><p>{copy.emptyBody}</p><Link className="button button-outline" href="/judges">{copy.emptyCta} <ArrowUpRight size={15} /></Link></div>
        ) : (
          <div className="event-grid">
            {hackathons.map((event, index) => (
              <Link href={`/h/${event.slug}`} className={`event-card event-card-${index % 3}`} key={event.id}>
                <div className="event-card-top"><span className="event-number">EVENT / {String(index + 1).padStart(2, "0")}</span><span className="card-arrow"><ArrowUpRight size={17} /></span></div>
                <h3>{event.name}</h3>
                <p>{event.description}</p>
                <div className="event-meta"><span><CalendarDays size={14} />{formatDate(event.event_date)}</span>{event.location && <span><MapPin size={14} />{event.location}</span>}</div>
                <div className="theme-list">{event.themes.slice(0, 3).map((theme) => <span key={theme}>{theme}</span>)}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="bottom-banner"><span>{copy.bannerEyebrow}</span><p>{copy.bannerTop}<br /><em>{copy.bannerBottom}</em></p><Link href="/judges" aria-label="Open judges and organizers"><ArrowUpRight size={22} /></Link></section>
    </>
  );
}
