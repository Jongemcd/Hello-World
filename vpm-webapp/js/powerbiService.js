// Embeds a Power BI report using powerbi-client (loaded via CDN in index.html).
// Two token sources are supported, chosen by config.powerbi.useBackendToken:
//  - false (default): "embed for your organization" - uses the signed-in
//    user's own AAD token. Viewers need a Power BI Pro/PPU license or a
//    workspace on Premium/Fabric capacity.
//  - true: "embed for your customers" - fetches a short-lived embed token
//    from your own backend (see backend/server.js), so viewers don't need
//    their own Power BI license. The backend holds the service principal
//    secret; never put it in front-end code.
const VPMPowerBI = (function () {
  async function getEmbedToken() {
    const cfg = window.VPM_CONFIG.powerbi;
    if (cfg.useBackendToken) {
      const res = await fetch(cfg.backendTokenEndpoint);
      if (!res.ok) throw new Error(`Embed token request failed: ${res.status}`);
      return res.json(); // expected shape: { token, embedUrl, reportId }
    }
    const token = await VPMAuth.getToken(cfg.scopes);
    return {
      token,
      reportId: cfg.reportId,
      embedUrl: `${cfg.embedUrlBase}?reportId=${cfg.reportId}&groupId=${cfg.workspaceId}`
    };
  }

  async function embed(container) {
    const { token, reportId, embedUrl } = await getEmbedToken();
    const models = window["powerbi-client"].models;

    const config = {
      type: "report",
      tokenType: models.TokenType.Aad,
      accessToken: token,
      embedUrl,
      id: reportId,
      settings: {
        panes: { filters: { visible: false }, pageNavigation: { visible: false } }
      }
    };

    window.powerbi.reset(container);
    return window.powerbi.embed(container, config);
  }

  return { embed };
})();
