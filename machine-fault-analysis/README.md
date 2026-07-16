# Master–Child Downtime Linkage Analysis

Links state-change events from the master packaging machine
(`tbl_tg_ngp2_hh_fofchanges_withreasoncode`) to the child Schubert boxing
machine's alarm stack (`tbl_tg_ngp2_schubert_alarmstack`) by timestamp, to
explain why the master stops on **@Fault_0081** ("Line stop – waiting for
schubert") and **@Fault_0085** ("Schubert – downstream machine not ready").

## Files

- **`dashboard.html`** — self-contained interactive dashboard. Open directly
  in a browser. Pick a date range (native calendar picker), click a fault bar
  in the master Pareto to drill into the linked child alarm breakdown, and
  read the auto-generated reasoning summary for the current selection.
- **`Master_Child_Downtime_Linkage_Analysis.xlsx`** — Excel workbook with the
  same linkage. The `Dashboard` sheet has two date cells (click to use
  Excel's calendar picker) and a fault-selector dropdown driving live
  SUMIFS-based Pareto tables, charts, and a formula-generated reasoning
  summary. Other sheets hold the supporting daily aggregates and the full
  event-level linkage (`LinkedEvents`, `LinkedEventChildDetail`). See the
  `ReadMe` sheet for methodology and a sheet-by-sheet guide.
- **`ci_report.html`** — continuous-improvement report for the master/child
  pair. Classifies every alarm as genuine technical failure vs. noise
  (guard/door interlocks, pre-warnings, operator/procedural messages,
  changeover mismatches, and — on the child side — restart-sequence chatter
  and production-mode status), then presents the cleaned Paretos for both
  machines and a 10-point, impact-ranked action plan.
- **`hu3_ci_report.html`** — same method applied to a third, independent
  machine (HU3). HU3's own log already tags each fault's severity in its ID
  (`Warning_` / `Alarm_` / `Fault_`); that tagging is used as the primary
  noise signal, layered with the same content-based override rules (guard
  interlocks, pre-warnings, procedural messages) as the other report.

## Headline finding from the cleaned analysis (master/child)

Of 2,426.7 hours of logged master downtime, only 979.0 hours (40.3%) is a
genuine equipment/process failure — a nearly equal share (992.5 hrs, 40.9%)
is guard/door interlocks (frequent, short, operator-driven, not
breakdowns). Once noise is removed, @Fault_0081/@Fault_0085 ("waiting for
Schubert") is the single largest true reliability issue at 221.1 hours —
larger than the next nine real technical fault families combined. See
`ci_report.html` for the full breakdown and action plan.

## Headline finding from HU3

Of 1,355.5 hours of logged HU3 downtime, 1,069.8 hours (78.9%) is genuine
technical failure — a much cleaner split than the packaging line. That
cleaned Pareto is dominated by one chronic issue: "Main air valve basic
machine pressure not present" is 590.4 hours — 55.2% of all real technical
downtime, at ~3.7 minutes per occurrence (a sustained supply problem, not
sensor chatter). See `hu3_ci_report.html` for the full breakdown and action
plan.

## Method summary

The master log is a change/event log — each row's duration runs until the
next row (capped at 4 hours to stop rare multi-day logging gaps from
skewing totals). For every master stoppage tagged `@Fault_0081` or
`@Fault_0085`, that row's active window is padded ±30 seconds (to absorb
clock/PLC-scan skew between the two control systems) and matched against
every child alarm-stack row whose timestamp falls inside it. Of the 13,596
such stoppages in the full master log, 1,421 predate the child log's Jan 22,
2026 start and can't be linked; of the remaining 12,175, 88.6% have at
least one child alarm captured in their window.
