import { Sparkles } from "lucide-react";
import StaffPortal from "@/components/staff-portal";

export default function JudgesPage() {
  return (
    <section className="staff-page">
      <div className="staff-intro"><span className="eyebrow"><span className="pulse-dot" /> THE PEOPLE BEHIND THE BUILD</span><h1>Thoughtful<br /><em>by design.</em></h1><p>Host an event, see what teams are making, and make every score count.</p><div className="staff-intro-note"><Sparkles size={16} /><span>For organizers &amp; judges</span></div></div>
      <StaffPortal />
    </section>
  );
}
