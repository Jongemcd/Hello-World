# Changing Room Locker Draw

A single self-contained web page for randomly assigning changing-room lockers
to staff, for the Gents and Ladies changing rooms.

## How to use it

1. Open `index.html` in a web browser (double-click it — no install or server needed).
2. Upload your Excel file. It should have a **Men** tab and a **Ladies** tab,
   each with one name per row (a header row like "Name" is fine — it's
   detected and skipped automatically).
3. Check the **Settings** — the app guesses which tab is which, but you can
   change it, and set a locker prefix/start number for each group to match
   your physical locker numbering.
4. Click **Run the Draw**. Watch the shuffle, then the full list appears.
5. Use **Export to Excel** to download the results as a workbook with a
   sheet each for Gents, Ladies, and a summary.

Turn on **Instant mode** (top toggle) to skip the animation entirely — the
draw runs automatically the moment the file is uploaded and the list appears
straight away.

## The "4th locker" rule

Lockers come in banks of four. By default, the app always leaves the 4th
locker in every bank **Unassigned (reserved)**, so there's spare capacity to
add new starts later without re-running the whole draw. This can be turned
off in Settings if a future draw doesn't need it.

## Notes

- Everything runs locally in your browser — the uploaded list and results
  never leave your machine.
- Re-running **Redraw** generates a brand new random order; re-download the
  export afterwards.
- The Excel reading/writing is powered by the bundled `vendor/xlsx.full.min.js`
  (SheetJS), so no internet connection is required to run the tool.
