import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CalendarDays, MapPin, Plus, Sparkles } from "lucide-react";
import { getHackathons } from "@/lib/hackathons";

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) return "Date to be announced";
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
          <span className="eyebrow"><span className="pulse-dot" /> THE PLACE WHERE IDEAS SHIP</span>
          <h1>Make a little<br /><span>future.</span></h1>
          <p>Find your next hackathon, share what your team is building, and give great ideas the recognition they deserve.</p>
          <a className="button button-dark" href="#events">Find your event <ArrowDownRight size={17} /></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-card art-card-back"><span>IDEA → IMPACT</span><div className="mini-bars"><i /><i /><i /><i /></div></div>
          <div className="art-card art-card-front"><span className="art-star">✳</span><strong>Build<br />the next<br />thing.</strong><span className="art-note">NO PERMISSION NEEDED</span></div>
          <span className="art-sparkle sparkle-one">✳</span><span className="art-sparkle sparkle-two">✦</span>
          <span className="art-tag">GOOD THINGS<br />START HERE</span>
        </div>
        <div className="hero-index">01 <span>/</span> 03</div>
      </section>

      <section className="event-section" id="events">
        <div className="section-heading">
          <div><span className="eyebrow muted-eyebrow">YOUR NEXT BIG IDEA</span><h2>Open hackathons<span className="heading-period">.</span></h2></div>
          <Link className="text-link" href="/judges">Host an event <ArrowUpRight size={16} /></Link>
        </div>
        {!configured ? (
          <div className="setup-notice">
            <div className="notice-icon"><Sparkles size={19} /></div>
            <div><strong>One last connection before launch</strong><p>Connect your free Supabase project to publish events and accept submissions. Setup steps are in the README.</p></div>
          </div>
        ) : hackathons.length === 0 ? (
          <div className="empty-state"><span className="empty-icon"><Plus size={19} /></span><strong>The next big thing starts with an event.</strong><p>No hackathons yet. Sign in as an organizer to create the first one.</p><Link className="button button-outline" href="/judges">Open organizer portal <ArrowUpRight size={15} /></Link></div>
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
      <section className="bottom-banner"><span>01 — FROM FIRST SKETCH TO FINAL PITCH</span><p>Build boldly.<br /><em>Judge fairly.</em></p><Link href="/judges" aria-label="Open judges and organizers"><ArrowUpRight size={22} /></Link></section>
    </>
  );
}
