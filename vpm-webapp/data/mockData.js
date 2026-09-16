// Mock data standing in for live SharePoint lists / Power BI datasets.
// Shapes here mirror what the Graph and Power BI services return, so swapping
// useMockData to false in config.js shouldn't require changing render.js.

function daysBack(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

window.VPM_MOCK = {
  pillars: {
    safety: {
      key: "safety",
      label: "Safety",
      legend: [
        { color: "green", label: "Safe Day" },
        { color: "yellow", label: "First Aid" },
        { color: "blue", label: "Dangerous Occurrence" },
        { color: "red", label: "OSHA" }
      ],
      days: {
        "2026-09-08": "red", "2026-09-09": "red",
        "2026-09-13": "red", "2026-09-14": "red"
      },
      ok: false,
      triggerText: "Safety Triggers are;\nGreen = Safe Day\nYellow = First Aid\nBlue = Dangerous Occurrence\nRed = OSHA",
      milestones: [
        { label: "Days Since Last OSHA Recordable (Red Day)", current: 54, milestone: 0 },
        { label: "Days Since Last First Aid (Yellow Day)", current: 65, milestone: 0 }
      ],
      actions: [
        { personResponsible: "Team Member A", actionNo: 20833, location: "Site 1 - Area A", actionRequired: "Draft a proposed engineering fix and evaluate a prototype; escalate to an external vendor if the internal option isn't viable.", dueDate: "2026-08-31" },
        { personResponsible: "Team Member B", actionNo: 19744, actionRequired: "Review current manual handling step and evaluate a mechanical lift alternative to reduce load.", location: "Site 1 - Area B", dueDate: "2026-08-29" },
        { personResponsible: "Team Member C", actionNo: 18796, actionRequired: "Coordinate with engineering on where to post the updated safety drawing for the line.", location: "Site 1 - Area B", dueDate: "2026-09-30" },
        { personResponsible: "Team Member D", actionNo: 20009, actionRequired: "Update the standard work instructions with the latest safety content.", location: "Site 1 - Area B", dueDate: "2026-08-20" },
        { personResponsible: "Team Member E", actionNo: 16974, actionRequired: "Look at sourcing a taller lift suitable for the space that can also serve other jobs nearby.", location: "Site 1 - Area B", dueDate: "2026-08-29" },
        { personResponsible: "Team Member F", actionNo: 20288, actionRequired: "Review process step markings and signage ahead of the upcoming changeover.", location: "Site 1 - Area B", dueDate: "2026-08-28" }
      ]
    },

    quality: {
      key: "quality",
      label: "Quality",
      legend: [
        { color: "green", label: "Target Met" },
        { color: "red", label: ">2 NCMRs" }
      ],
      days: { "2026-09-08": "red", "2026-09-09": "red", "2026-09-10": "red" },
      ok: true,
      triggerText: "Quality Trigger is\n3 Days out of 5 with > 2 NCMRs",
      milestones: [],
      actions: []
    },

    service: {
      key: "service",
      label: "Service",
      legend: [
        { color: "green", label: "Volume Target Met" },
        { color: "red", label: "Volume Target Missed" }
      ],
      days: {
        "2026-09-08": "red", "2026-09-09": "red", "2026-09-10": "red",
        "2026-09-11": "red", "2026-09-13": "red", "2026-09-14": "red"
      },
      ok: false,
      triggerText: "Service Trigger is\n3 Days out of 5 where Volume Target is not met",
      milestones: [],
      actions: []
    },

    cost: {
      key: "cost",
      label: "Cost",
      legend: [
        { color: "green", label: "Targets Met" },
        { color: "red", label: "Eff / Waste / Volume Target Missed" }
      ],
      days: {
        "2026-09-02": "red", "2026-09-06": "red", "2026-09-10": "red", "2026-09-11": "red"
      },
      ok: false,
      triggerText: "Cost Trigger =\n3 Days out of 5\nwhere either Eff,\nWaste or Volume\ntarget is not met",
      milestones: [],
      actions: [],
      // Optional Power BI-style dashboard panel shown next to the calendar (see Cost page mock).
      dashboard: {
        title: "Cost Metric",
        kpis: [
          { label: "Efficiency MTD", value: "€ 33K", tone: "info" },
          { label: "Waste Var MTD", value: "€ 20K", tone: "info" },
          { label: "Absorption MTD", value: "€ 17K", tone: "info" },
          { label: "Absorption Planned Target", value: "€ 66.1K", tone: "highlight" }
        ],
        charts: [
          { title: "Efficiency Variance", type: "variance", points: [2, 1, -1, 3, 4, 5, 4, 3, 2, 3, 2, 1, -1, -2, 1, 2, 3, 4, 5, 4] },
          { title: "Waste Variance", type: "variance", points: [3, 2, 3, 2, -1, -1, 1, 1, 2, 1, 2, 3, 4, -1, 1, 2] },
          { title: "Cycle Counts Variance", type: "variance", points: [-2, 1, -1, 2, -3, 1, 2, -1, 3, -2, 1] },
          { title: "Absorption Variance", type: "variance", points: [1, -1, 2, -1, 3, 2, -2, 1, 3, 2, -1, 4, 3, -1, 2] }
        ]
      }
    }
  },

  accountability: {
    counts: { Open: 22, Closed: 9, Planned: 1, Archived: 11 },
    items: [
      { dateDue: "2026-09-10", status: "Open", created: daysBack(6), id: 1833, personAssigned: "Team Member A", action: "Provide a status update on the open item.", actionFrom: "Team Member G", tracking: "Tier 2" },
      { dateDue: "2026-09-16", status: "Open", created: daysBack(1), id: 1838, personAssigned: "Team Member B", action: "Follow up on work completed earlier this week.", actionFrom: "Team Member H", tracking: "Tier 2" },
      { dateDue: "2026-09-17", status: "Open", created: daysBack(22), id: 1787, personAssigned: "Team Member C", action: "Roll out the updated triggers to the team.", actionFrom: "Team Member I", tracking: "Tier 2" },
      { dateDue: "2026-09-17", status: "Planned", created: daysBack(1), id: 1839, personAssigned: "Team Member D", action: "Reach a decision point on the proposed implementation.", actionFrom: "Team Member J", tracking: "Tier 2" },
      { dateDue: "2026-09-17", status: "Open", created: daysBack(1), id: 1840, personAssigned: "Team Member E", action: "Confirm the backup owner while the primary owner is on leave.", actionFrom: "Team Member E", tracking: "Tier 2" },
      { dateDue: "2026-09-17", status: "Open", created: daysBack(1), id: 1841, personAssigned: "Team Member F", action: "Confirm the outstanding item identified earlier in the week was addressed.", actionFrom: "Team Member I", tracking: "Tier 2" },
      { dateDue: "2026-09-17", status: "Open", created: daysBack(1), id: 1842, personAssigned: "Team Member C", action: "Check hours logged for last Monday.", actionFrom: "Team Member C", tracking: "Tier 2" },
      { dateDue: "2026-09-17", status: "Open", created: daysBack(1), id: 1843, personAssigned: "Team Member G", action: "Review the waste trend for the past few days.", actionFrom: "Team Member E", tracking: "Tier 2" }
    ]
  }
};
