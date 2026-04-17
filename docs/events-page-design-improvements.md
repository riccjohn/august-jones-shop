# Events Page Design Improvements

Remaining issues identified during design review (2026-04-17). High-priority items have been implemented.

## Medium Priority

### "Today / This Weekend" Urgency Badge
Events happening today or within 48 hours should show a `HAPPENING NOW` or `TODAY` badge — a small yellow pill at the top-right of the card, or a pulsing yellow left-border animation. This is a conversion opportunity when a current-day event exists.

### MapPin Icon + City Chip on Venue
- Prepend a Lucide `<MapPin>` icon to the venue name line
- Add a bold city tag chip (e.g. `MADISON, WI`) as a small outlined badge in yellow so users can scan by geography without reading full card text

### Date Text Prominence
Date/time is `text-sm` at 60% opacity — same visual weight as the city label. Bump to `text-base` and opacity to `/80`. The date is the most critical piece of info on the card for someone deciding whether to attend.

### Hero Diagonal Texture Overlay
Add a subtle repeating diagonal stripe pattern to the hero background to evoke athletic/jersey energy:
```css
background-image: repeating-linear-gradient(
  -45deg,
  transparent,
  transparent 14px,
  rgba(255, 182, 18, 0.04) 14px,
  rgba(255, 182, 18, 0.04) 15px
);
```

## Low Priority

### Add to Calendar CSS — Brand Mismatch
The AddToCalendar widget renders its own unstyled UI. Override with Tailwind arbitrary selectors:
```
[&_.atcb-button]:bg-[#222] [&_.atcb-button]:text-[#f6f4f0]
```
Or use the library's CSS custom properties. See `add-to-calendar-button` docs.

### CTA Button Hierarchy
"Get Directions" and "Add to Calendar" have equal visual weight. Get Directions is the secondary action — should be ghost/outline only. Add to Calendar should be primary (solid yellow bg) since it drives repeat attendance.

### Card Gap Rhythm
Six identical eggshell cards with uniform `gap-6` creates a wall of sameness. Consider a thin `#ffb612/30` horizontal rule between cards ("ticker tape" feel) or floating city labels between event groups.
