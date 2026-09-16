const VPM_NAV = [
  { key: "summary", label: "Summary", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { key: "safety", label: "Safety", icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" },
  { key: "quality", label: "Quality", icon: "M20 6L9 17l-5-5" },
  { key: "service", label: "Service", icon: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" },
  { key: "cost", label: "Cost", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { key: "accountability", label: "Accountability", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" }
];

const PILLAR_KEYS = ["safety", "quality", "service", "cost"];

function iconSvg(path) {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"></path></svg>`;
}

const VPMApp = (function () {
  let currentView = "summary";
  let autoplayTimer = null;
  let liveAccountability = null;
  let livePillars = null;

  function pillars() {
    return livePillars || window.VPM_MOCK.pillars;
  }

  function accountability() {
    return liveAccountability || window.VPM_MOCK.accountability;
  }

  function navigateTo(view) {
    currentView = view;
    document.querySelectorAll(".nav-item").forEach(el => {
      el.classList.toggle("active", el.dataset.key === view);
    });

    const main = document.getElementById("main");
    const title = document.getElementById("page-title");

    if (view === "summary") {
      title.textContent = "VPM - Summary Page";
      VPMRender.renderSummary(main, pillars(), navigateTo);
    } else if (PILLAR_KEYS.includes(view)) {
      title.textContent = `VPM - ${pillars()[view].label} Page`;
      VPMRender.renderPillarDetail(main, pillars()[view]);
    } else if (view === "accountability") {
      title.textContent = "VPM - Accountability Page";
      VPMRender.renderAccountability(main, accountability());
    } else {
      title.textContent = "VPM";
      VPMRender.renderPlaceholder(main, VPM_NAV.find(n => n.key === view)?.label || view);
    }
  }

  function toggleAutoplay(btn) {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
      btn.textContent = "Press Play to Autoplay Screens";
      return;
    }
    const order = ["summary", ...PILLAR_KEYS, "accountability"];
    let idx = order.indexOf(currentView);
    if (idx === -1) idx = 0;
    btn.textContent = "Pause Autoplay";
    autoplayTimer = setInterval(() => {
      idx = (idx + 1) % order.length;
      navigateTo(order[idx]);
    }, 8000);
  }

  async function loadLiveData() {
    if (window.VPM_CONFIG.useMockData) return;

    VPMAuth.init();
    await VPMAuth.signIn();

    const cfg = window.VPM_CONFIG.graph.lists;
    const [safetyFields, accountabilityFields] = await Promise.all([
      VPMGraph.getListItems(cfg.safetyActions),
      VPMGraph.getListItems(cfg.accountability)
    ]);

    livePillars = window.VPM_MOCK.pillars; // day/trigger data still comes from wherever you compute it
    livePillars.safety.actions = VPMGraph.toSafetyActions(safetyFields);

    const items = VPMGraph.toAccountabilityItems(accountabilityFields);
    liveAccountability = {
      counts: items.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {}),
      items
    };
  }

  function renderNav() {
    const nav = document.getElementById("nav");
    nav.innerHTML = VPM_NAV.map(n => `
      <div class="nav-item" data-key="${n.key}">
        ${iconSvg(n.icon)}<span>${n.label}</span>
      </div>`).join("");

    nav.querySelectorAll(".nav-item").forEach(el => {
      el.addEventListener("click", () => navigateTo(el.dataset.key));
    });
  }

  async function init() {
    document.getElementById("app-name").textContent = window.VPM_CONFIG.branding.appName;
    document.getElementById("logo").textContent = window.VPM_CONFIG.branding.logoText;
    document.documentElement.style.setProperty("--accent", window.VPM_CONFIG.branding.accentColor);

    renderNav();

    document.getElementById("autoplay-btn").addEventListener("click", (e) => toggleAutoplay(e.target));

    try {
      await loadLiveData();
    } catch (err) {
      console.error("Falling back to mock data - live data load failed:", err);
    }

    navigateTo("summary");
  }

  return { init, navigateTo };
})();

document.addEventListener("DOMContentLoaded", VPMApp.init);
