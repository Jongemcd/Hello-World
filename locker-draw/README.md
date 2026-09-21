# Changing Room Locker Draw

A single self-contained web page for randomly assigning changing-room lockers
to staff, for the Gents and Ladies changing rooms.

## How to use it

1. Open `index.html` in a web browser (double-click it — no install or server needed).
2. Upload your Excel file. It should have a **Men** tab and a **Ladies** tab,
   each with a header row containing a **Name** column, plus optional
   **Index** and **Clock Number** columns — these help tell people apart when
   two team members share a name, and both are carried through to the results
   and the export. Older, header-less lists (just a name per row) still work;
   the app falls back to numbering rows itself and leaves clock number blank.
3. Check the **Settings** — the app guesses which tab is which, but you can
   change it, and set a locker prefix/start number for each group to match
   your physical locker numbering.
4. Click **Run the Draw**. Watch the shuffle, then the full list appears.
5. Use **Export to Excel** to download the results as a workbook with a
   sheet each for Gents, Ladies, and a summary.

Turn on **Instant mode** (top toggle) to skip the animation entirely — the
draw runs automatically the moment the file is uploaded and the list appears
straight away.

## One locker per person

Each person on the list is placed into exactly one locker — the draw shuffles
the list once and hands each entry off in turn, so nobody is picked twice from
a clean list. The one thing the app can't know on its own is whether the
*source file* has the same person entered twice by mistake. To catch that:

- If the **same clock number** appears more than once, the app blocks the
  draw with a warning until you either fix the source file and re-upload, or
  tick a box confirming you've checked it and want to proceed anyway.
- If the **same name** appears more than once with no clock number to tell
  them apart, you get an informational note (not a block) — this is often
  just two different colleagues sharing a name, so add clock numbers if you
  want the app to be sure.

## The "4th locker" rule

Lockers come in banks of four. By default, the app always leaves the 4th
locker in every bank **Unassigned (reserved)**, so there's spare capacity to
add new starts later without re-running the whole draw. This can be turned
off in Settings if a future draw doesn't need it.

## Actual lockers on site

By default the app sizes the lockers to exactly fit everyone on the list
(rounded up to full banks of four). If your changing room has a fixed
physical count instead, enter it under **Actual lockers on site** in
Settings for each group — the draw will then use exactly that number of
lockers rather than auto-sizing.

If there are more people than that fixed count can hold (after the 4th-locker
reservation), the draw won't silently drop anyone: it blocks with a warning
telling you exactly how many people won't get a locker, and once run, those
people are listed at the bottom of the results/export marked **"No locker
available"** so nothing is lost track of.

## Summary tab stays live

The exported **Summary** and **Dashboard** sheets use real Excel formulas
(`COUNTIF` against the Status column), not fixed numbers. So if you later
open the export and fill in a name + clock number on a locker that was
previously "Unassigned", the Assigned/Remaining counts on the Summary and
Dashboard tabs update automatically the next time Excel recalculates
(normally as soon as you edit the sheet or reopen the file).

The **Dashboard** tab shows Total / Assigned / Remaining / % Assigned for
each group plus a simple text bar. Note: the free, client-side Excel library
this tool uses can't write native charts or cell colors, so there's no
colored KPI tiles or an embedded pie/bar chart — just live formulas and a
plain block-character bar. If you want an actual chart, select the
Dashboard's table and use Excel's own Insert → Chart — it'll build off the
live numbers already there.

## Branding

The colors (crimson `#C01E39`, charcoal, white, warm taupe/grey) are sampled
from Hollister's own site so the tool looks at home alongside other internal
Hollister pages. The decorative locker/people graphics are drawn in CSS/SVG
rather than reusing any photography from the site.

## Notes

- Everything runs locally in your browser — the uploaded list and results
  never leave your machine.
- Re-running **Redraw** generates a brand new random order; re-download the
  export afterwards.
- The Excel reading/writing is powered by the bundled `vendor/xlsx.full.min.js`
  (SheetJS), so no internet connection is required to run the tool.
