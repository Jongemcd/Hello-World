# Changing Room Locker Lottery

A single self-contained web page that runs a fair, random locker lottery for
the Gents and Ladies changing rooms, using the Facilities locker layout and
the associates list.

## How to use it

1. Open `index.html` in a web browser (double-click it — no install, server or
   internet connection needed). Keep the `vendor/` and `assets/` folders next to it.
2. Upload the two files:
   - **Locker layout (Facilities)** — a **Gents** and a **Ladies** tab. Lockers
     are grouped under "Zone …" headings, with rows labelled **Top**,
     **Middle Top**, **Middle Bottom** and **Bottom** in the first column.
     Each locker number sits in its own cell. A **red fill** marks a Corner
     locker, an **amber fill** marks a Half size locker, and **"-"** marks a
     dummy slot. Any text after the locker numbers in a row is the
     Facilities comment.
   - **Associates list** — a **Male** and a **Female** tab with
     **Payroll Id** (clock number), **First Name** and **Last Name**.
3. Check **Settings**: the app matches Gents ↔ Male and Ladies ↔ Female
   automatically (change them if needed) and shows, per room, how many
   lockers are in the lottery versus how many people are on the list.
4. Click **Run the Lottery**, then **Export to Excel**.

Turn on **Instant mode** to skip the animation — the lottery runs as soon as
both files are loaded (after any warnings are acknowledged).

Sample files with made-up names are in `samples/` for trying it out.

## Lottery rules

| Locker | In the lottery? | Shown as |
|---|---|---|
| Any locker in the **Top** row | No | **Unassigned** |
| **Red** fill | No | **Corner** + Facilities comment |
| **Amber** fill | No | **Half size** + Facilities comment |
| **"-"** | Never (not a real locker) | **Dummy** |
| Everything else | Yes | **Assigned** (or **Unassigned (spare)** if there are more lockers than people) |

The Top / Corner / Half size rules are switches in Settings (all on by
default) in case HR wants to relax one later. A red or amber locker in the
Top row is shown by its colour reason; its Position still says Top.

The associates are shuffled once (using the browser's cryptographic random
generator) and handed out to the available lockers in locker-number order.

**If there are more people than available lockers**, the app warns before
the draw and asks for confirmation. Everyone who misses out is listed as
**"No locker available"** with a **waiting list number** in their random
draw order — nobody is silently dropped.

Other checks before the draw: the same clock number appearing twice (blocks
until acknowledged), duplicate locker numbers on the layout, and any fill
colour that isn't the red/amber key.

## Locker room map

Results open on a **Map** of each changing room (switch to **List** for the
table). Every zone is drawn the way it's laid out on the Facilities sheet: one
column per bank of four, Top to Bottom, with each locker coloured by status —
assigned (dark, showing the clock number), unassigned Top (dashed), spare
(green dashed), Corner (red), Half size (amber) and dummy slots (hatched).

- Click a locker to see who's in it, or why it isn't in the lottery.
- Searching by name, clock number or locker number highlights the matching
  lockers on the map and fades the rest.
- The waiting list isn't on the map (those people have no locker); it's in
  the List view.

Zones are shown in the order they appear on the sheet — the map reflects each
zone's own layout, not where the zones sit relative to each other in the room.

## The Excel export

- **Gents Lockers** / **Ladies Lockers** — every locker in layout order:
  Locker No, Zone, Position, Locker Type, Clock No, First Name, Last Name,
  Status, Comment — followed by the waiting list.
- **Summary** — per room: total lockers, assigned, unassigned (and how many of
  those are Top), Corner, Half size, dummy slots, waiting list.
- **Dashboard** — the headline figures per room, % of lockers assigned and a
  simple text bar.

The Summary and Dashboard are **live Excel formulas**. "Assigned" counts
lockers with a clock number entered, so if HR later types a new start's clock
number and name onto an **Unassigned** row, Assigned goes up and Unassigned
goes down automatically — there's no need to change the Status column.

The free, offline Excel library this tool uses can't write cell colours or
native charts, so the Dashboard uses plain formulas and a text bar. For a
real chart, select the Dashboard table and use Excel's Insert → Chart.

## Notes

- Everything runs locally in the browser — the uploaded files and results
  never leave the machine.
- Changing a file, a tab or a rule clears the previous results so a stale
  draw can't be exported by mistake. **Redraw** runs a brand new lottery.
- Excel reading/writing uses the bundled `vendor/xlsx.full.min.js` (SheetJS).

## Branding

The colors (crimson `#C01E39`, charcoal, white, warm taupe/grey) are sampled
from Hollister's own site. The banner photo (`assets/hero-locker-room.jpg`)
was supplied for this tool — keep the `assets/` folder next to `index.html`
alongside `vendor/`. To change it, replace that file (a wide crop works best;
the banner shows the middle band of the image).
