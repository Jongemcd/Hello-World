// Thin wrapper around msal-browser (loaded via CDN in index.html).
// Uses the "embed for your organization" pattern: the signed-in user's own
// AAD token is used for both Microsoft Graph and Power BI, so viewers need
// their normal SharePoint permissions and, for Power BI, a Pro/PPU license
// (or a workspace on a Premium/Fabric capacity).
const VPMAuth = (function () {
  let msalInstance = null;
  let account = null;

  function init() {
    const cfg = window.VPM_CONFIG.msal;
    msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId: cfg.clientId,
        authority: cfg.authority,
        redirectUri: cfg.redirectUri
      },
      cache: { cacheLocation: "sessionStorage" }
    });
    const existing = msalInstance.getAllAccounts();
    if (existing.length > 0) account = existing[0];
    return msalInstance;
  }

  async function signIn() {
    const result = await msalInstance.loginPopup({ scopes: ["User.Read"] });
    account = result.account;
    return account;
  }

  function getAccount() {
    return account;
  }

  async function getToken(scopes) {
    if (!account) throw new Error("Not signed in yet - call VPMAuth.signIn() first.");
    const request = { scopes, account };
    try {
      const res = await msalInstance.acquireTokenSilent(request);
      return res.accessToken;
    } catch (err) {
      const res = await msalInstance.acquireTokenPopup(request);
      return res.accessToken;
    }
  }

  return { init, signIn, getAccount, getToken };
})();
