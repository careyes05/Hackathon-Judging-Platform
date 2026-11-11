# Logos

Drop image files here, then point a slot at them in `lib/site-config.ts`.

PNG with a transparent background or SVG both work. Aim for roughly 2x the
height you plan to display so it stays sharp on retina screens.

## What is here now

| File                          | What it is                                   |
| ----------------------------- | -------------------------------------------- |
| `gpmc.png`                    | Gabelli Product Management Club               |
| `fordham-ais.png`             | Fordham AI Society — icon and wordmark together |
| `fordham-ais-mark.png`        | Fordham AI Society — circular icon only       |
| `fordham-ais-wordmark.png`    | Fordham AI Society — wordmark only            |

These were cut out of a screenshot, so the edges are as sharp as that
screenshot allowed. If either club has the original PNG or SVG, overwrite the
file with the same name and nothing else needs to change.

All four have transparent backgrounds and dark ink, so they read on light
surfaces. They will disappear on the maroon bands — do not put them in a slot
that sits on a dark background without light versions.

Example — club mark in the header, both clubs in the partner row:

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
