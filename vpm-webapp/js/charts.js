// Minimal dependency-free SVG bar chart, used as a stand-in for an embedded
// Power BI visual until a real report is wired up (see powerbiService.js).
const VPMCharts = (function () {
  function varianceBar(container, { title, points }) {
    const w = 280, h = 90, mid = h / 2, barW = w / points.length;
    const max = Math.max(1, ...points.map(p => Math.abs(p)));
    const scale = (h / 2 - 6) / max;

    let bars = "";
    points.forEach((p, i) => {
      const barH = Math.abs(p) * scale;
      const x = i * barW + 1;
      const y = p >= 0 ? mid - barH : mid;
      const color = p >= 0 ? "#4caf6d" : "#e0525f";
      bars += `<rect x="${x}" y="${y}" width="${barW - 2}" height="${Math.max(barH, 1)}" fill="${color}" rx="1"></rect>`;
    });

    container.innerHTML = `
      <div class="chart-title">${title}</div>
      <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none">
        <line x1="0" y1="${mid}" x2="${w}" y2="${mid}" stroke="#d7dae0" stroke-width="1"></line>
        ${bars}
      </svg>`;
  }

  return { varianceBar };
})();
