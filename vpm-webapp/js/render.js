// Builds the HTML for each view. Pulls from window.VPM_MOCK when
// config.useMockData is true, otherwise from the live Graph/Power BI services
// wired up in app.js.
const VPMRender = (function () {
  const ICON_OK = `<span class="status-icon ok">&#9786;</span>`; // smiley
  const ICON_BAD = `<span class="status-icon bad">&#9785;</span>`; // frowny

  function mockBanner() {
    return window.VPM_CONFIG.useMockData
      ? `<div class="mock-banner">Showing mock data - set <code>useMockData: false</code> in config.js once SharePoint/Power BI are connected.</div>`
      : "";
  }

  function daysSince(dateKey) {
    const d = new Date(dateKey);
    const diff = Math.round((Date.now() - d.getTime()) / 86400000);
    return diff;
  }

  function mostRecent(dayStatusMap, color) {
    const matches = Object.keys(dayStatusMap || {}).filter(k => dayStatusMap[k] === color).sort();
    return matches.length ? matches[matches.length - 1] : null;
  }

  function renderSummary(main, pillars, navigateTo) {
    main.innerHTML = mockBanner() + `<div class="pillar-grid" id="pillar-grid"></div>`;
    const grid = document.getElementById("pillar-grid");

    Object.values(pillars).forEach(p => {
      const card = document.createElement("div");
      card.className = "pillar-card";
      card.innerHTML = `
        <div class="card-header">${p.label}</div>
        <div class="cal-slot"></div>
        <div class="card-body">
          <pre>${p.triggerText}</pre>
          ${p.ok ? ICON_OK : ICON_BAD}
        </div>`;
      card.addEventListener("click", () => navigateTo(p.key));
      grid.appendChild(card);

      const now = new Date();
      VPMCalendar.mount(card.querySelector(".cal-slot"), {
        year: now.getFullYear(),
        month: now.getMonth(),
        dayStatusMap: p.days
      });
    });
  }

  function renderPillarDetail(main, pillar) {
    const now = new Date();
    let dashboardHtml = "";

    if (pillar.dashboard) {
      dashboardHtml = `
        <div class="panel">
          <h3 style="text-align:center;margin-top:0">${pillar.dashboard.title}</h3>
          <div class="kpi-row">
            ${pillar.dashboard.kpis.map(k => `
              <div class="kpi-tile ${k.tone === "highlight" ? "highlight" : ""}">
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-value">${k.value}</div>
              </div>`).join("")}
          </div>
          <div id="pbi-embed-target" style="display:none;height:420px;"></div>
          <div class="chart-grid" id="chart-grid"></div>
        </div>`;
    } else if (pillar.milestones && pillar.milestones.length) {
      dashboardHtml = `
        <div class="panel">
          ${pillar.milestones.map(m => `
            <div class="milestone-banner">
              <span>${m.label.toUpperCase()}<br><small style="font-weight:400">CURRENT</small></span>
              <div class="value-box"><span class="num">${m.current}</span></div>
              <span>&nbsp;<br><small style="font-weight:400">MILESTONE</small></span>
              <div class="value-box"><span class="num">${m.milestone}</span></div>
            </div>`).join("")}
          ${renderActionTable(pillar.actions)}
        </div>`;
    } else if (pillar.actions && pillar.actions.length) {
      dashboardHtml = `<div class="panel">${renderActionTable(pillar.actions)}</div>`;
    } else {
      dashboardHtml = `<div class="panel"><p style="color:var(--muted)">No open items for ${pillar.label}.</p></div>`;
    }

    main.innerHTML = mockBanner() + `
      <div class="detail-grid">
        <div>
          <div class="calendar" id="pillar-calendar"></div>
          <div class="panel" style="margin-top:12px;font-size:12px;color:var(--muted)">
            ${pillar.legend.map(l => `<div><span class="badge" style="background:var(--${l.color})">&nbsp;</span> ${l.label}</div>`).join("")}
          </div>
        </div>
        ${dashboardHtml}
      </div>`;

    VPMCalendar.mount(document.getElementById("pillar-calendar"), {
      year: now.getFullYear(),
      month: now.getMonth(),
      dayStatusMap: pillar.days
    });

    if (pillar.dashboard) {
      const chartGrid = document.getElementById("chart-grid");
      if (window.VPM_CONFIG.powerbi.enabled) {
        const target = document.getElementById("pbi-embed-target");
        target.style.display = "block";
        VPMPowerBI.embed(target).catch(err => {
          target.style.display = "none";
          console.error("Power BI embed failed, falling back to mock charts.", err);
          renderMockCharts(chartGrid, pillar.dashboard.charts);
        });
      } else {
        renderMockCharts(chartGrid, pillar.dashboard.charts);
      }
    }
  }

  function renderMockCharts(chartGrid, charts) {
    charts.forEach(c => {
      const panel = document.createElement("div");
      panel.className = "chart-panel";
      chartGrid.appendChild(panel);
      VPMCharts.varianceBar(panel, c);
    });
  }

  function renderActionTable(actions) {
    if (!actions.length) return `<p style="color:var(--muted)">No open items.</p>`;
    return `<table class="data-table">
      <thead><tr><th>Person Responsible</th><th>Action No</th><th>Location</th><th>Action Required</th><th>Due Date</th></tr></thead>
      <tbody>
        ${actions.map(a => `<tr>
          <td>${a.personResponsible}</td>
          <td>${a.actionNo}</td>
          <td>${a.location}</td>
          <td>${a.actionRequired}</td>
          <td>${a.dueDate}</td>
        </tr>`).join("")}
      </tbody></table>`;
  }

  function initials(name) {
    return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  }

  function dueCellClass(dateStr) {
    const diff = daysSince(dateStr) * -1; // days until due
    if (diff < 0) return "overdue";
    if (diff <= 1) return "soon";
    return "";
  }

  function renderAccountability(main, data) {
    main.innerHTML = mockBanner() + `
      <div class="panel" style="margin-bottom:16px">
        <h3 style="margin-top:0">Weekly Accountability Metrics</h3>
        <div class="kpi-row">
          ${Object.entries(data.counts).map(([label, value]) => `
            <div class="kpi-tile"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div></div>`).join("")}
        </div>
      </div>
      <div class="panel">
        <table class="data-table">
          <thead><tr><th>Date Due</th><th>Status</th><th>ID</th><th>Person Assigned</th><th>Action</th><th>Action From</th><th>Tracking</th></tr></thead>
          <tbody>
            ${data.items.map(i => `<tr>
              <td class="due-cell ${dueCellClass(i.dateDue)}">${i.dateDue}<br><small>${i.created}</small></td>
              <td><span class="badge ${i.status}">${i.status}</span></td>
              <td>${i.id}</td>
              <td><span class="avatar-sm">${initials(i.personAssigned)}</span>${i.personAssigned}</td>
              <td>${i.action}</td>
              <td>${i.actionFrom}</td>
              <td>${i.tracking}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function renderPlaceholder(main, title) {
    main.innerHTML = `<div class="panel"><p style="color:var(--muted)">${title} - not scaffolded yet.</p></div>`;
  }

  return { renderSummary, renderPillarDetail, renderAccountability, renderPlaceholder };
})();
