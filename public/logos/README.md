# Logos

Drop image files here, then point a slot at them in `lib/site-config.ts`.

PNG with a transparent background or SVG both work. Aim for roughly 2x the
height you plan to display so it stays sharp on retina screens.

Example — club mark in the header, Fordham mark in the partner row:

```ts
logos: {
  header: { src: "/logos/club.png", alt: "Fordham AI Club", height: 30 },
  hero: null,
  eventPage: null,
  staff: null,
  footer: null,
  partners: [
    { src: "/logos/fordham.png", alt: "Fordham University", height: 34 },
  ],
},
```

Available slots:

| Slot        | Where it appears                                  |
| ----------- | ------------------------------------------------- |
| `header`    | Top-left, replacing the default icon mark          |
| `hero`      | Above the headline on the landing page             |
| `eventPage` | Above the event title on an event page             |
| `staff`     | Above the sign-in card on `/judges`                |
| `footer`    | Beside the footer tagline                          |
| `partners`  | A row above the footer on every page (accepts many)|

Set a slot to `null` to hide it. Use only marks the club is allowed to use —
Fordham's own logo rules are at
fordham.edu/university-marketing-and-communications/brand-guidelines/
